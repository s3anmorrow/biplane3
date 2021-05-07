var Tank = function() {
	// tank state constants
	var KILLED = TankState.KILLED;
	var MOVING = TankState.MOVING;

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
	// state of tank
	this.state = -1;
	// maximum number of bullets tank can shoot
	this.bulletMax = 1;
	// grab clip for tank
	this.clip = assetManager.getClip("Tank");

	// setup variables for faster access
	var clip = this.clip;
	// others
	var speed = 1;
	var bulletCount = 0;
	var enemyTankType, enemyJeepType;

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
	var survivorPool = objectPool.survivorPool;
	var tankPool = objectPool.tankPool;
	var jeepPool = objectPool.jeepPool;
	var planePool = objectPool.planePool;
	var redPlane = null;

	// construct custom event object for plane being killed
	var eventKilled = new createjs.Event("onGameEvent", true);
	eventKilled.source = this;
	eventKilled.id = "tankKilled";

	// ------------------------------------------------------ event handlers
	function onKilled(bitmap, animation) {
        clip.removeEventListener("animationend", onKilled);
		clip.y = -1000;
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
		redPlane = window.redPlane;
		// random positioning
		clip.x = myStartX;
		clip.y = 486;
		clip.gotoAndPlay(this.type + "Moving");
		// random fire frequency
		fireFrequency = randomMe(1,3) * GameConstants.FRAME_RATE;
		// tank specific adjustments
		if (this.type == "RedTank") {
			speed = this.cruiseSpeed * -1;
			enemyTankType = "BlueTank";
			enemyJeepType = "BlueJeep";
		} else {
			speed = this.cruiseSpeed;
			enemyTankType = "RedTank";
			enemyJeepType = "RedJeep";
		}
		stage.addChildAt(clip,index);
	};

	this.killMe = function() {
		if (this.state != KILLED) {
			speed = 0;
			// stop the tank object
			this.state = KILLED;
			// listen for when animation is complete
            clip.addEventListener("animationend", onKilled);

			clip.gotoAndPlay(this.type + "Kill");
			createjs.Sound.play("Explosion3");
		}
	};

	this.removeMe = function(){
		stage.removeChild(clip);
		objectPool.dispose(this);
	};

	this.adjustBulletCount = function(value) {
		bulletCount += value;
	};

	this.fireMe = function() {
		// FIRE BULLETS - can I fire anymore bullets?
		if (bulletCount < this.bulletMax) {
			// get bullet object and start it
			var bullet = objectPool.getBullet();
			bullet.type = "Bullet";
			bullet.owner = this.type;
			var bulletStartX = clip.x - 25;
			var bulletSpeed = this.bulletSpeed;
			if (this.type == "RedTank") bulletStartX = clip.x + 25;
			else bulletSpeed = this.bulletSpeed * -1;
			bullet.startMe(this, bulletStartX, clip.y - 16, bulletSpeed, 0);
			this.adjustBulletCount(1);
		}
	};

	this.updateMe = function(){
        var n = 0;

		// move cloud by speed and in relation to landscape scroll displacement
		clip.x = clip.x - speed - landscape.getScrollDisplace();

		// only fire if tank is not killed
		if (this.state == MOVING) {
			var dif = -1;
			var length = -1;
			// can I fire on target?
			if (frameCounter >= fireFrequency) {
				// fire at enemy tank?
				length = tankPool.length;
				for (n=0; n<length; n++) {
					var tank = tankPool[n];
					if ((tank.used) && (tank.type == enemyTankType) && (tank.state != TankState.KILLED)) {
						// calculate distance between each redTank and tank
						dif = clip.x - tank.clip.x;
						if (this.type == "RedTank") dif = dif * -1;
						if ((dif > 0) && (dif < 400)) {
							this.fireMe();
							frameCounter = 0;
							return;
						}
					}
				}
				// fire at enemy jeep?
				length = jeepPool.length;
				for (n=0; n<length; n++) {
					var jeep = jeepPool[n];
					if ((jeep.used) && (jeep.type == enemyJeepType) && (jeep.state != JeepState.KILLED)) {
						// calculate distance between each redTank and tank
						dif = clip.x - jeep.clip.x;
						if (this.type == "RedTank") dif = dif * -1;
						if ((dif > 0) && (dif < 400)) {
							this.fireMe();
							frameCounter = 0;
							return;
						}
					}
				}

				// blueTank specific targets
				if (this.type == "BlueTank") {
					// fire at survivors?
					length = survivorPool.length;
					for (n=0; n<length; n++) {
						var survivor = survivorPool[n];
						// calculate distance between each survivor and tank
						if ((survivor.used) && (survivor.state != SurvivorState.KILLED)) {
							dif = clip.x - survivor.clip.x;
							if ((dif > 0) && (dif < 400)) {
								this.fireMe();
								frameCounter = 0;
								return;
							}
						}
					}

					// fire at landed redPlane?
					if (redPlane.state == PlaneState.LANDED) {
						// calculate distance between redPlane and tank
						dif = clip.x - redPlane.clip.x;
						// fire at redPlane
						if ((dif > 0) && (dif < 300)) {
							this.fireMe();
							frameCounter = 0;
						}
					}
				}
			}
			frameCounter++;
		}
	};
};

var TankState = {
	"KILLED":-1,
	"MOVING":0,
};
