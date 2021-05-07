var Jeep = function() {
	// jeep state constants
	var KILLED = JeepState.KILLED;
	var MOVING = JeepState.MOVING;

	// private game variables
	var stage = window.stage;
	var assetManager = window.assetManager;
	var objectPool = window.objectPool;

	// public properties
	this.type = "";
	this.used = false;
	this.usedIndex = -1;
	this.poolIndex = -1;
	// speed of bullets
	this.bulletSpeed = 8;
	// speed of tank
	this.cruiseSpeed = 1;
	// state of jeep
	this.state = -1;
	// maximum number of bullets jeep can shoot
	this.bulletMax = 2;
	// grab clip for jeep
	this.clip = assetManager.getClip("Jeep");
	this.turretClip = assetManager.getClip("Turret");

	// setup variables for faster access
	var clip = this.clip;
	var turretClip = this.turretClip;
	// others
	var speed = 1;
	var bulletCount = 0;
	var enemyPlane;
	var stageLeft = 0;
	var stageRight = canvas.width - 13;

	// number of seconds between firing
	var fireFrequency = -1;
	var frameCounter = 0;

	// reference to the landscape object
	var landscape;
	// access to this object from callbacks [out of scope issues]
	var me = this;
	// get reference to global randomMe method
	var randomMe = window.randomMe;
	// access to pools
	var planePool = objectPool.planePool;

	// construct custom event object for plane being killed
	var eventKilled = new createjs.Event("onGameEvent", true);
	eventKilled.source = this;
	eventKilled.id = "jeepKilled";

	// ------------------------------------------------------ event handlers
	function onKilled(bitmap, animation) {
        clip.removeEventListener("animationend", onKilled);
		clip.y = -1000;
		turretClip.y = -1000;
		// dispatch eventKilled that the tank has been killed
		clip.dispatchEvent(eventKilled);
		// memory management
		stage.removeChild(clip);
		// return this object to the object pool
		objectPool.dispose(me);
	}

	// ------------------------------------------------------ public methods
	this.startMe = function(myStartX, index) {
		// initialization
		this.state = MOVING;
		frameCounter = 0;
		speed = 1;
		// gain access to global objects
		landscape = window.landscape;
		// random positioning
		clip.x = myStartX;
		clip.y = 480;
		clip.gotoAndPlay(this.type + "Moving");
		// random fire frequency
		fireFrequency = randomMe(1.5,3) * GameConstants.FRAME_RATE;
		// jeep specific adjustments
		if (this.type == "RedJeep") {
			turretClip.x = clip.x - 12;
			speed = this.cruiseSpeed * -1;
			enemyPlane = "BluePlane";
		} else {
			turretClip.x = clip.x + 12;
			speed = this.cruiseSpeed;
			enemyPlane = "RedPlane";
		}
		turretClip.y = 463;
		stage.addChildAt(turretClip,index);
		stage.addChildAt(clip,index);
	};

	this.killMe = function() {
		if (this.state != KILLED) {
			speed = 0;
			stage.removeChild(turretClip);
			// stop the jeep object
			this.state = KILLED;
			// listen for when animation is complete
            clip.addEventListener("animationend", onKilled);
			clip.gotoAndPlay(this.type + "Kill");
			createjs.Sound.play("Explosion3");
		}
	};

	this.removeMe = function(){
		stage.removeChild(clip);
		stage.removeChild(turretClip);
		objectPool.dispose(this);
	};

	this.adjustBulletCount = function(value) {
		bulletCount += value;
	};

	this.fireMe = function() {
		// FIRE BULLETS - can I fire anymore bullets?
		if (bulletCount < this.bulletMax) {
			var r = Math.floor(turretClip.rotation);
			// random adjustment
			r = r + randomMe(-15,15);
			// get bullet object and start it
			var bullet = objectPool.getBullet();
			bullet.type = "Bullet";
			bullet.owner = this.type;
			// adjustments for specific jeeps
			var bulletSpeed = this.bulletSpeed;
			/*
			if (this.type == "BlueJeep"){
				// rotation adjustment
				r = r + 180;
				if (r > 360) r = r - 360;
				bulletSpeed = this.bulletSpeed * -1;
			}
			*/
			bullet.startMe(this, turretClip.x, turretClip.y, (cosTable[r] * bulletSpeed), (sinTable[r] * bulletSpeed));
			this.adjustBulletCount(1);
		}
	};

	this.updateMe = function(){
		// move cloud by speed and in relation to landscape scroll displacement
		clip.x = clip.x - speed - landscape.getScrollDisplace();
		if (this.type == "RedJeep") turretClip.x = clip.x - 12;
		else turretClip.x = clip.x + 12;
		// only if turret on the stage
		if ((turretClip.x < stageLeft) || (turretClip.x > stageRight)) return;
		// only track/fire if jeep is not killed
		if (this.state == MOVING) {
			// fire at enemy plane?
			var length = planePool.length;
			for (var n=0; n<length; n++) {
				var plane = planePool[n];
				if ((plane.used) && (plane.type == enemyPlane)) {
					// calculate distance between each jeep and potential target
					var dif = -1;
					var planeClip = plane.clip;
					dif = clip.x - planeClip.x;
					if ((dif > -400) && (dif < 400)) {
						// track to the enemy
						// get currentAngle of turret
						var currentAngle = turretClip.rotation;
						// get targetAngle of target relative to turret
						var targetAngle = 180 + (Math.atan2(turretClip.y - planeClip.y, turretClip.x - planeClip.x) * 57.2957795);
						// rotate turret towards target within bounds
						if (targetAngle < 200) turretClip.rotation = 200;
						else if (targetAngle > 340) turretClip.rotation = 340;
						else {
							turretClip.rotation = targetAngle;
							// can I fire on target now?
							if (frameCounter >= fireFrequency) {
								if ((plane.type == enemyPlane) && (plane.state != PlaneState.KILLED)) {
									this.fireMe();
									frameCounter = 0;
									break;
								}
							}
						}
						frameCounter++;
					}
				}
			}
		}
	};
};

var JeepState = {
	"KILLED":-1,
	"MOVING":0,
};
