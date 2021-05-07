// this object uses the module pattern instead of the constructor pattern
var Plane = function() {
	// plane state constants
	var KILLED = PlaneState.KILLED;
	var LANDED = PlaneState.LANDED;
	var LANDING = PlaneState.LANDING;
	var TAKING_OFF = PlaneState.TAKING_OFF;
	var STALLED = PlaneState.STALLED;
	var FLYING = PlaneState.FLYING;

	// private game variables
	var stage = window.stage;
	var assetManager = window.assetManager;
	var objectPool = window.objectPool;

	// public properties
	this.type = "";
	this.used = false;
	this.survivor = null;
	this.usedIndex = -1;
	this.poolIndex = -1;
	// the speed of the plane of which all speeds are based off
	this.cruiseSpeed = 6;
	this.bulletSpeed = 12;
	this.bombSpeed = 4;
	// the degrees of rotation for each rotateUp / rotateDown
	this.rotateIncrement = 5;
	// maximum number of bullets plane can shoot
	this.bulletMax = 4;
	// plane currently has a bomb loaded
	this.bombLoaded = false;
	// plane's pilot if any
	this.pilot = null;
	// facing of plane 1=right, -1=left
	this.facing = -1;
	// state of plane
	this.state = -1;
	// get current animation clips for object
	this.clip = assetManager.getClip("Plane");
	this.indicatorClip = assetManager.getClip("Digits");

	// setup variables for faster access
	var clip = this.clip;
	var indicatorClip = this.indicatorClip;

	// construct custom event object for plane being killed
	var eventKilled = new createjs.Event("onGameEvent", true);
	eventKilled.source = this;
	eventKilled.id = "planeKilled";
	var eventLanded = new createjs.Event("onGameEvent", true);
	eventLanded.source = this;
	eventLanded.id = "planeLanded";
	var eventTakeOff = new createjs.Event("onGameEvent", true);
	eventTakeOff.source = this;
	eventTakeOff.id = "planeTakeOff";

	// private variables
	var me = this; // access to this object from callbacks [out of scope issues]
	var bulletCount = 0;
	// reference to the global game objects
	var landscape;
	var redFactory;
	var blueFactory;
	var redBunker;
	var blueBunker;
	var tower;
	var balloon;
	// facing of plane 1=right, -1=left
	var facing = -1;

	// other
	// setup local references to trig lookup tables
	var sinTable = window.sinTable;
	var cosTable = window.cosTable;
	var dirCounter = 0;
	var safeLandLRotation = -1;
	var safeLandURotation = -1;
	var enabled = false;
	// number of seconds between survivor firing (when on board)
	var rearFireFrequency = 1 * GameConstants.FRAME_RATE;
	// number of seconds for indicator
	var indicatorDuration = 3 * GameConstants.FRAME_RATE;
	var frameCounter = 0;
	var xDisplace = 0;
	var yDisplace = 0;
	var speed = 0;
	// sounds
	var sndTakeOff = null,sndIdle = null,sndLanding = null,sndFlip = null,sndStall = null;
	var planeSndFlipPlayed;
    var planeSndClimbPlayed;
	// access to pools
	var planePool = objectPool.planePool;
	var survivorPool = objectPool.survivorPool;

	// ------------------------------------------------------ event handlers
	function onKilled(bitmap, animation) {

		// plane has been killed (killed animation is complete)
        clip.removeEventListener("animationend", onKilled);

		clip.stop();
		// bump clip off screen to prepare it for landscape slide back to base
		clip.y = -1000;
		me.stopMe();
		// dispatch eventKilled that the plane has been killed
		if (bitmap !== undefined) clip.dispatchEvent(eventKilled);
        if (me.type == "BluePlane") {
			// memory management
			stage.removeChild(clip);
			// return this object to the object pool
			objectPool.dispose(me);
		}
		// remove survivor
		me.survivor = null;
	}

	function onFlipped(bitmap, animation) {
		// clear out event function
        clip.removeEventListener("animationend", onFlipped);
		// reverse the facing of the plane
		me.setFacing(facing * -1);
	}
	// ------------------------------------------------------ public methods
	this.getXDisplace = function() {return xDisplace;};
	this.setFacing = function(value) {
		// local variable for quicker access
		facing = value;
		// property variable
		this.facing = facing;
		clip.rotation = 0;
		var bombAdjust = "";
		if (this.bombLoaded) bombAdjust = "Bomb";
		if (facing == 1) {
			if (this.survivor === null) clip.gotoAndPlay(this.type + "Right" + bombAdjust);
			else clip.gotoAndPlay(this.type + "RightPassenger" + bombAdjust);
			safeLandLRotation = 5;
			safeLandURotation = 20;
		} else {
			if (this.survivor === null) clip.gotoAndPlay(this.type + "Left" + bombAdjust);
			else clip.gotoAndPlay(this.type + "LeftPassenger" + bombAdjust);
			safeLandLRotation = 340;
			safeLandURotation = 355;
		}
	};

	this.loadMe = function(mySurvivor) {
		this.survivor = mySurvivor;
		this.setFacing(facing);
		createjs.Sound.play("SurvivorPickup");
	};

	this.unLoadMe = function() {
		this.survivor = null;
		this.setFacing(facing);
	};

	this.adjustBulletCount = function(value) {
		bulletCount += value;
	};

	this.rotateUp = function(){
		if (this.state > TAKING_OFF) {
			// increment rotation (clockwise by 5 degrees)
			clip.rotation = clip.rotation - (this.rotateIncrement * facing);
			if (clip.rotation < 0) clip.rotation = 360 + clip.rotation;
			if (clip.rotation >= 360) clip.rotation = 0;
		}
	};

	this.rotateDown = function(){
		if (this.state > TAKING_OFF) {
			// increment rotation (clockwise by 5 degrees)
			clip.rotation = clip.rotation + (this.rotateIncrement * facing);
			if (clip.rotation < 0) clip.rotation = 360 + clip.rotation;
			if (clip.rotation >= 360) clip.rotation = 0;
		}
	};
    
    this.flipMe = function() {
        //if ((clip.rotation >= 175) && (clip.rotation <= 185)) {
        if ((clip.rotation >= 165) && (clip.rotation <= 195)) {
            if (sndTakeOff !== null) sndTakeOff.stop();
            if (sndStall !== null) sndStall.stop();
            sndFlip = createjs.Sound.play(this.type + "Flip");
            clip.addEventListener("animationend", onFlipped);
            // play plane flipping animation clip
            if (facing == 1) clip.gotoAndPlay(this.type + "FlipRight");
            else clip.gotoAndPlay(this.type + "FlipLeft");
        }
    };

	this.spaceMe = function() {
		// depends on whether plane landed or not
		if (enabled) {
			if (this.state == LANDED) {
				// TAKE OFF
				if (sndIdle !== null) sndIdle.stop();
				if (sndLanding !== null) sndLanding.stop();
				sndTakeOff = createjs.Sound.play(this.type + "TakeOff");
				this.state = TAKING_OFF;
				clip.dispatchEvent(eventTakeOff);
			} else {
				this.fireMe();
			}
		}
	};

	this.fireMe = function(rearGun) {
		if ((this.state == FLYING) || (this.state == STALLED)) {
			// FIRE BULLETS
			// can I fire anymore bullets?
			if (bulletCount < this.bulletMax) {
				var r = clip.rotation;
				// rotation adjustments so bullet shoots out of the front/rear of the plane
				if (rearGun) {
					if (facing == 1) {
						r = r + 180;
						if (r > 360) r = r - 360;
					}
				} else {
					if (facing == -1) {
						r = r + 180;
						if (r > 360) r = r - 360;
					}
				}
				// get bullet object and start it
				var bullet = objectPool.getBullet();
				bullet.type = "Bullet";
				bullet.owner = this.type;
				bullet.startMe(this, clip.x, clip.y, (cosTable[r] * this.bulletSpeed), (sinTable[r] * this.bulletSpeed));
				this.adjustBulletCount(1);
			}
		}
	};

	this.loadBomb = function() {
		this.bombLoaded = true;
		// reset facing so bomb is shown
		this.setFacing(this.facing);
	};

	this.bombMe = function() {
		if (this.bombLoaded) {
			// get bullet object and start it
			var bomb = objectPool.getBullet();
			bomb.type = "Bomb";
			bomb.owner = this.type;
			bomb.startMe(this, clip.x, clip.y, 0, this.bombSpeed);
			this.bombLoaded = false;
			// have to do this manually since setFacing sets plane to be at 180 / 0 degress
			if (facing == 1) {
				if (this.survivor === null) clip.gotoAndPlay(this.type + "Right");
				else clip.gotoAndPlay(this.type + "RightPassenger");
			} else {
				if (this.survivor === null) clip.gotoAndPlay(this.type + "Left");
				else clip.gotoAndPlay(this.type + "LeftPassenger");
			}
		}
	};

	this.indicateMe = function(enable,which){
		if (this.state != KILLED) {
			if (enable) {
				frameCounter = 0;
				indicatorClip.gotoAndPlay(which);
				stage.addChild(indicatorClip);
				if (which == "stall") createjs.Sound.play("StallWarning");
				else createjs.Sound.play("Alert");
			} else {
				indicatorClip.stop();
				stage.removeChild(indicatorClip);
			}
		}
	};

	this.killMe = function() {
		if (this.state != KILLED) {
			// stop the plane object
			this.state = KILLED;
			// kill sound effects
			if (sndTakeOff !== null) sndTakeOff.stop();
			if (sndLanding !== null) sndLanding.stop();
			if (sndStall !== null) sndStall.stop();
			if (sndFlip !== null) sndFlip.stop();
			planeSndFlipPlayed = false;
            planeSndClimbPlayed = false;
			// clear out the survivor if carrying one
			if (this.survivor !== null) {
				this.survivor.killMe();
				this.survivor = null;
			}
			// reset variables
			xDisplace = 0;
			yDisplace = 0;
			stage.removeChild(indicatorClip);
			// clear out pilot if have one
			if (this.pilot !== null) {
				this.pilot.killMe();
				this.pilot = null;
			}
			// stop/remove balloon indicator if active
			this.indicateMe(false);

            // listen for when animation is complete
            clip.addEventListener("animationend", onKilled);

			clip.gotoAndPlay("Explosion");
			createjs.Sound.play("Explosion1");
		}
	};

	this.removeMe = function() {
		// initialization
		this.state = KILLED;
		// kill sound effects
		if (sndTakeOff !== null) sndTakeOff.stop();
		if (sndLanding !== null) sndLanding.stop();
		if (sndStall !== null) sndStall.stop();
		if (sndFlip !== null) sndFlip.stop();
		stage.removeChild(indicatorClip);
		// clear out pilot if have one
		if (this.pilot !== null) {
			this.pilot.killMe();
			this.pilot = null;
		}
		onKilled();
	};

	this.startMe = function() {
		// initialization - gain access to global objects
		landscape = window.landscape;
		redFactory = window.redFactory;
		blueFactory = window.blueFactory;
		redBunker = window.redBunker;
		blueBunker = window.blueBunker;
		tower = window.tower;
		balloon = window.balloon;
		planeSndFlipPlayed = false;
        planeSndClimbPlayed = false;
		this.survivor = null;
		this.resetMe();
		// add to stage if not there already
		stage.addChild(clip);
		// adjustments for BluePlanes only
		if (this.type == "BluePlane") {
            
            /*
            // making the blue planes a little slower
            this.cruiseSpeed = this.cruiseSpeed - 1;
            this.rotateIncrement = this.rotateIncrement - 1;
            */
            
			// bluePlane starts at full speed (no need to take off)
			speed = this.cruiseSpeed;
			// drop BluePlanes below the clouds
			var skyIndex = stage.getChildIndex(sky);
			stage.setChildIndex(clip,skyIndex);
		}
	};

	this.stopMe = function() {
		enabled = false;
		speed = 0;
		xDisplace = 0;
		yDisplace = 0;
	};

	this.resetMe = function() {
		this.state = LANDED;
		this.bombLoaded = false;
		frameCounter = 0;
		clip.x = 175;
		clip.y = 474;
		bulletCount = 0;
		this.setFacing(1);
		enabled = true;
		sndIdle = createjs.Sound.play(this.type + "Idle");
	};

	this.updateMe = function(){
		if (!enabled) return;

		// STEP I : Plane behaviour
		// grab global data and drop into locals for multiple access below (faster performance)
		var r = clip.rotation;
		// ------------------------- plane movement and flying behaviour
		// make adjustments to r if plane is moving left so that the trig gets it moving in the correct facing
		if (facing == -1) {
			if (r > 180) r = r - 180;
			else r = r + 180;
			if (r == 360) r = 0;
		}
		if (this.state == STALLED) {
			// STALLED
			xDisplace = 0;
			// manually adjust yDisplace so plane falls to the ground
			yDisplace = yDisplace + 0.10;
			// check if falling fast enough and at right angle to pull out of stall
			if ((yDisplace > 6) && (r > 80) && (r < 100)) {
				speed = 6;
				if (sndStall !== null) sndStall.stop();
				sndTakeOff = createjs.Sound.play(this.type + "TakeOff");
				this.state = FLYING;
				this.indicateMe(false);
			}
		} else if (this.state == LANDING) {
			// LANDING
			clip.y = 474;
			speed -= 0.2;
			if (speed <= 0) {
				this.state = LANDED;
				speed = 0;
				clip.dispatchEvent(eventLanded);
			}
			// calculate displacements via lookup tables
			xDisplace = cosTable[r] * speed;
			yDisplace = sinTable[r] * speed;
		} else if (this.state == LANDED) {
			// LANDED
		} else if (this.state == TAKING_OFF) {
			// TAKING_OFF
			speed += 0.2;
			if (speed > this.cruiseSpeed) {
				this.state = FLYING;
				this.rotateUp();
			}
			// calculate displacements via lookup tables
			xDisplace = cosTable[r] * speed;
			yDisplace = sinTable[r] * speed;
		} else if (this.state == KILLED) {
			// if landscape scrolls the explosion from dying should go with it
			clip.x = clip.x - landscape.getScrollDisplace();
		} else {
			// FLYING
			// adjust speed (accleration or decleration)
			if ((r > 240) && (r < 300)) {
				if (speed > -1) speed -= 0.10;
			} else if ((r > 210) && (r < 330)) {
				if (speed > (this.cruiseSpeed - 2)) speed -= 0.05;
			} else if ((r > 60) && (r < 120)) {
				if (speed < (this.cruiseSpeed + 3)) speed += 0.2;
				if (!planeSndFlipPlayed) {
					if (sndTakeOff !== null) sndTakeOff.stop();
					if (sndStall !== null) sndStall.stop();
					sndFlip = createjs.Sound.play(this.type + "Flip");
					planeSndFlipPlayed = true;
				}
			} else if ((r > 30) && (r < 150)) {
				if (speed < (this.cruiseSpeed + 2)) speed += 0.05;
			} else {
				if (speed < this.cruiseSpeed) speed += 0.10;
				else if (speed > this.cruiseSpeed) speed -= 0.10;
				planeSndFlipPlayed = false;
			}
            
            // play climbing sound effect if the speed drops below half of cruise speed
            if (speed < (this.cruiseSpeed/2)) {
                if ((!planeSndClimbPlayed) && (!planeSndFlipPlayed) && (this.type != "bluePlane")) {
                    if (sndTakeOff !== null) sndTakeOff.stop();
					if (sndStall !== null) sndStall.stop();                    
                    createjs.Sound.play(this.type + "Climbing");
                    planeSndClimbPlayed = true;
                }
            } else if (speed > (this.cruiseSpeed/2)) {
                planeSndClimbPlayed = false;
            }

			// check if plane is ready to land (RedPlane only)
			if (this.type == "RedPlane") {
				if ((clip.y > 472) && (clip.rotation >= safeLandLRotation) && (clip.rotation <= safeLandURotation)) {
					this.state = LANDING;
					clip.rotation = 0;
					if (sndTakeOff !== null) sndTakeOff.stop();
					if (sndFlip !== null) sndFlip.stop();
					sndLanding = createjs.Sound.play("RedPlaneLanding");
				}
			}

			// check if plane off left/right/top of the stage and bounce it back (RedPlane only)
			if (this.type == "RedPlane") {
				if ((clip.x < 0) || (clip.x > 800)) {
					// flip direction of plane (do 180 degrees)
					if (facing == -1) {
						if ((clip.rotation > 90) && (clip.rotation < 270)) {
							// facing left and off left of screen
							clip.rotation = 0;
						} else {
							// facing left and off right of screen (upside down)
							clip.rotation = 180;
						}
					} else {
						if ((clip.rotation > 90) && (clip.rotation < 270)) {
							// facing right and off left of screen (upside down)
							clip.rotation = 0;
						} else {
							// facing right and off right of screen
							clip.rotation = 180;
						}
					}
					// adjust r local variable to new clip rotation
					r = clip.rotation;
					// bump the clip back a bit onto the stage again
					if (clip.x < 0) clip.x = 10;
					else clip.x = 790;
				}
			}

			// stall plane if speed dropped to 0 or off top of the screen
			if ((speed < 0) || (clip.y < -10)) {
				this.state = STALLED;
				sndStall = createjs.Sound.play(this.type + "Stall");
				if (this.type == "RedPlane") this.indicateMe(true,"stall");
			} else {
				// calculate displacements via lookup tables
				xDisplace = cosTable[r] * speed;
				yDisplace = sinTable[r] * speed;
			}
		}

		// move plane x and y position
		clip.x += xDisplace;
		clip.y += yDisplace;
		// adjust indicator position
		indicatorClip.x = clip.x - 8;
		indicatorClip.y = clip.y - 35;
		// turn off indicator now?
		if ((stage.contains(indicatorClip)) && (frameCounter !== 0) && (frameCounter % indicatorDuration === 0)) this.indicateMe(false);

        var length = 0;
		// survivor firing rear run at enemy plane (only redPlane)?
		if (this.survivor !== null) {
			length = planePool.length;
			for (n=0; n<length; n++) {
				var target = planePool[n];
				var targetClip = target.clip;
				//if ((target.used) && (target != this) && (frameCounter % rearFireFrequency === 0)) {
                if ((target.used) && (target != this) && (frameCounter % 120 === 0)) {
					// calculate distance between each plane and potential target
					var dif = clip.x - targetClip.x;
                    if ((dif < 0) && (dif > -400) && (this.facing == -1)) {
                        // enemy is on the red plane's right
                        // target in angle range?
						if ((clip.rotation < (targetClip.rotation + 20)) && (clip.rotation > (targetClip.rotation - 20))) this.fireMe(true);
						break;
                    } else if ((dif > 0) && (dif < 400) && (this.facing == 1)) {
                        // enemy is on the red plane's left
                        // target in angle range?
						if ((clip.rotation < (targetClip.rotation + 20)) && (clip.rotation > (targetClip.rotation - 20))) this.fireMe(true);
						break;
                    }
                    
                    /*
					// target in horizontal range?
					if ((dif > -400) && (dif < 400)) {
						// target in angle range?
						if ((clip.rotation < (targetClip.rotation + 20)) && (clip.rotation > (targetClip.rotation - 20))) this.fireMe(true);
						break;
					}
                    */
				}
			}
		}

		// STEP II : collision detection
		var n=0;
		var survivor=null;
		// has the plane collided with ground / factory / tower / balloon
		if ((ndgmr.checkPixelCollision(clip, landscape.ground, 1) !== false) && ((clip.rotation < safeLandLRotation) || (clip.rotation > safeLandURotation))) this.killMe();
        else if (ndgmr.checkPixelCollision(clip, blueFactory.clip, 1) !== false) this.killMe();
		else if (ndgmr.checkPixelCollision(clip, redFactory.clip, 1) !== false) this.killMe();
		else if (ndgmr.checkPixelCollision(clip, blueBunker.clip) !== false) this.killMe();
		else if (ndgmr.checkPixelCollision(clip, redBunker.clip) !== false) this.killMe();
		else if (ndgmr.checkPixelCollision(clip, tower.clip) !== false) this.killMe();
		else if ((balloon.state != BalloonState.KILLED) && (ndgmr.checkPixelCollision(clip, balloon.clip) !== false)) {
			this.killMe();
			balloon.killMe();
		}

		// has the plane crashed into any survivors?
		if (this.state == PlaneState.KILLED) {
			length = survivorPool.length;
			for (n=0; n<length; n++) {
				survivor = survivorPool[n];
				if ((survivor.used) && (survivor.state == SurvivorState.WANDERING) && (ndgmr.checkPixelCollision(clip, survivor.clip) !== false)) {
					survivor.killMe();
				}
			}
		}
		frameCounter++;
	};
};

var PlaneState = {
	"KILLED":-1,
	"LANDED":0,
	"LANDING":1,
	"TAKING_OFF":2,
	"STALLED":3,
	"FLYING":4
};
