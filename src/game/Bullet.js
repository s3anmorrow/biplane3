var Bullet = function() {
	// bullet state constants
	var KILLED = BulletState.KILLED;
	var MOVING = BulletState.MOVING;

	// private game variables
	var stage = window.stage;
	var assetManager = window.assetManager;
	var objectPool = window.objectPool;

	// public properties
	this.type = "";
	this.used = false;
	this.usedIndex = -1;
	this.poolIndex = -1;
	this.owner = null;
	// state of bullet
	this.state = -1;
	// grab clip for bullet
	this.clip = assetManager.getClip("Bullet");
	this.explosionClip = assetManager.getClip("Plane");

	// private property variables
	var clip = this.clip;
	var explosionClip = this.explosionClip;
	var owner = this.owner;
	var ownerType;

	// reference to the global game objects
	var landscape;
	var balloon;
	var redBunker;
	var prison1, prison2, prison3;

	// other
	var canvas = window.canvas;
	var stageLeft = -10;
	var stageRight = canvas.width + 10;
	var stageTop = -10;
	var xDisplace, yDisplace;
	var distance;
	// access to this object from callbacks [out of scope issues]
	var me = this;
	var bombSound;
	// access to pool objects
	var planePool = objectPool.planePool;
	var redPlane = planePool[0];
	var survivorPool = objectPool.survivorPool;
	var prisonPool = objectPool.prisonPool;
	var tankPool = objectPool.tankPool;
	var jeepPool = objectPool.jeepPool;
	var factoryPool = objectPool.factoryPool;
	var redFactory = factoryPool[0];
	var blueFactory = factoryPool[1];

	// ------------------------------------------------------ event handlers
	function onKilled(bitmap, animation) {
		// end animation
        explosionClip.removeEventListener("animationend", onKilled);
		explosionClip.stop();
		explosionClip.y = -2000;
		// return this object to the object pool
		objectPool.dispose(me);
		stage.removeChild(explosionClip);
		// memory management
		me.owner = null;
	}

	// ------------------------------------------------------ public methods
	this.startMe = function(myOwner, x, y, xd, yd) {
		// initialization
		owner = myOwner;
		ownerType = owner.type;

		// gain access to global objects
		landscape = window.landscape;
		balloon = window.balloon;
		redBunker = window.redBunker;

		this.state = MOVING;
		distance = 0;
		xDisplace = xd;
		yDisplace = yd;
		clip.x = x;
		clip.y = y;
		if (this.type == "Bomb") {
			clip.gotoAndPlay("Bomb");
			bombSound = createjs.Sound.play("Bomb");
		} else {
			clip.gotoAndStop(ownerType + "Bullet");
			if ((ownerType == "RedPlane") || (ownerType == "RedTank") || (ownerType == "RedJeep") || (ownerType == "RedBunker")) createjs.Sound.play("RedFire");
			else createjs.Sound.play("BlueFire");
		}
		// place bullet on displaylist behind the owner
		var index = stage.getChildIndex(myOwner.clip);
		stage.addChildAt(clip, index - 1);
	};

	this.killMe = function() {
		// initialization
		this.state = KILLED;
		// reset variables
		xDisplace = 0;
		yDisplace = 0;
		// adjust explosion clip if explosion occurred (a bomb)
		if (this.type == "Bomb") {
			explosionClip.x = clip.x;
			explosionClip.y = clip.y;
			stage.addChild(explosionClip);
			clip.stop();
			stage.removeChild(clip);
            explosionClip.addEventListener("animationend", onKilled);
			explosionClip.gotoAndPlay("Explosion");
			// stop bomb sound and play explosion
			bombSound.stop();
			createjs.Sound.play("Explosion1");
		} else {
			this.removeMe();
		}
	};

	this.removeMe = function(){
		clip.y = -2000;
		// return this object to the object pool
		objectPool.dispose(this);
		stage.removeChild(clip);
		// decrement bulletCount of owner
		if ((ownerType != "RedBunker") && (ownerType != "BlueBunker")) owner.adjustBulletCount(-1);
		// memory management
		this.owner = null;
	};

	this.updateMe = function(){
		// STEP I : Bullet Behaviour
		// move ball x and y position
		clip.x += xDisplace - landscape.getScrollDisplace();
		clip.y += yDisplace;
		if (this.state == MOVING) {
			// check if bullet off the screen
			if ((ownerType == "RedPlane") || (ownerType == "BluePlane") || (ownerType == "BlueJeep") || (ownerType == "RedJeep")) {
				// bullet belongs to a plane || jeep
				if ((this.type != "Bomb") && ((clip.x < stageLeft) || (clip.x > stageRight) || (clip.y < stageTop))) {
					this.killMe();
					return;
				}
			} else {
				// bullet belongs to a tank / bunker - kill bullet if it has gone over 850 pixels
				distance += Math.abs(xDisplace);
				if (distance >= 850) {
					this.killMe();
					return;
				}
			}

			//console.log("bullet: " + clip.x + " : " + ownerType + " ground: " + landscape.ground.x);

			// STEP II : collision detection
			var n=0, length=0;
			var plane=null, prison=null, tank=null, survivor=null;
			if ((ownerType == "RedPlane") || (ownerType == "RedJeep") || (ownerType == "RedTank") || (ownerType == "RedBunker")) {
				if (this.type != "Bomb") {
					length = planePool.length;
					for (n=1; n<length; n++) {
						// has the bullet collided with any blue plane? (skip first one since that is the redPlane)
						plane = planePool[n];
						if ((plane.used) && (ndgmr.checkPixelCollision(clip, plane.clip, 0, true) !== false)) {
							this.killMe();
							plane.killMe();
							return;
						}
					}
				}

				length = tankPool.length;
				for (n=0; n<length; n++) {
					// has the bullet collided with any enemy tank or jeep?
					tank = tankPool[n];
					if ((tank.used) && (tank.state >= TankState.MOVING) && (tank.type == "BlueTank") && (ndgmr.checkPixelCollision(clip, tank.clip, 0, true) !== false)) {
						this.killMe();
						tank.killMe();
						return;
					}
					jeep = jeepPool[n];
					if ((jeep.used) && (jeep.state >= JeepState.MOVING) && (jeep.type == "BlueJeep") && (ndgmr.checkPixelCollision(clip, jeep.clip, 0, true) !== false)) {
						this.killMe();
						jeep.killMe();
						return;
					}
				}
			}

			if (ownerType == "RedPlane") {
				length = prisonPool.length;
				for (n=0; n<length; n++) {
					// has the bullet collided with any prison?
					prison = prisonPool[n];
					if ((prison.state == PrisonState.NORMAL) && (ndgmr.checkPixelCollision(clip, prison.clip, 0, true) !== false)) {
						this.killMe();
						prison.breakMe();
						return;
					}
				}
				if (this.type == "Bomb") {
					// has the bomb collided with the blueFactory?
					if (ndgmr.checkPixelCollision(clip, blueFactory.clip, 0, true) !== false) {
						this.killMe();
						blueFactory.killMe();
						return;
					}
				}
			}

			if ((ownerType == "BluePlane") || (ownerType == "BlueJeep") || (ownerType == "BlueTank") || (ownerType == "BlueBunker")) {
				if (this.type != "Bomb") {
					// has the bullet collided with the redPlane?
					if (ndgmr.checkPixelCollision(clip, redPlane.clip, 0, true) !== false) {
						this.killMe();
						redPlane.killMe();
						return;
					}

					length = tankPool.length;
					for (n=0; n<length; n++) {
						// has the bullet collided with any enemy tanks?
						tank = tankPool[n];
						if ((tank.used) && (tank.state >= TankState.MOVING) && (tank.type == "RedTank") && (ndgmr.checkPixelCollision(clip, tank.clip, 0, true) !== false)) {
							this.killMe();
							tank.killMe();
							return;
						}
						jeep = jeepPool[n];
						if ((jeep.used) && (jeep.state >= JeepState.MOVING) && (jeep.type == "RedJeep") && (ndgmr.checkPixelCollision(clip, jeep.clip, 0, true) !== false)) {
							this.killMe();
							jeep.killMe();
							return;
						}
					}
				} else {
					// has the bomb collided with the redFactory?
					if (ndgmr.checkPixelCollision(clip, redFactory.clip, 0, true) !== false) {
						this.killMe();
						redFactory.killMe();
						return;
					}
				}
			}

			// ANY vehicle bullet collision detection (if the bullet is still in use after previous checks)
			// has the bullet collided with the ground?
			if (ndgmr.checkPixelCollision(clip, landscape.ground,1,true) !== false) {
				this.killMe();
				return;
			} else if (ndgmr.checkPixelCollision(clip, redBunker.clip, 0, true) !== false) {
				this.killMe();
				return;
			} else if ((this.type != "Bomb") && (balloon.state == BalloonState.FLYING) && (ndgmr.checkPixelCollision(clip, balloon.clip, 0, true) !== false)) {
				// balloon has been killed
				this.killMe();
				if (ownerType == "RedPlane") balloon.killMe(true);
				else balloon.killMe();
				return;
			} else {
				if ((ownerType != "RedBunker") && (ownerType != "BlueBunker")) {
					length = survivorPool.length;
					for (n=0; n<length; n++) {
						// has the bullet collided with a survivor?
						survivor = survivorPool[n];
						if ((survivor.used) && (survivor.state != SurvivorState.KILLED) && (ownerType != "redTank") && (ndgmr.checkPixelCollision(clip, survivor.clip,0,true) !== false)) {
							this.killMe();
							survivor.killMe();
							return;
						}
					}
				}
			}
		} else {
			// move the explosion with the landscape
			explosionClip.x += xDisplace - landscape.getScrollDisplace();
			explosionClip.y += yDisplace;
		}
	};
};

var BulletState = {
	"KILLED":-1,
	"MOVING":0,
};
