// this object uses the module pattern instead of the constructor pattern
var Bunker = function() {

	// private game variables
	var stage = window.stage;
	var assetManager = window.assetManager;
	var objectPool = window.objectPool;

	// public properties
	this.type = "";
	this.used = false;
	this.usedIndex = -1;
	// speed of bullets
	this.bulletSpeed = 8;
	// grab all clips from AssetManager
	this.clip = assetManager.getClip("Misc");
	this.turretClip = assetManager.getClip("Turret");

	// local variable references for speedier access
	var clip = this.clip;
	var turretClip = this.turretClip;

	// others
	// reference to the landscape object to get ground scrolling
	var landscape;
	var enemyPlane;
	var enemyTank;
	var enemyJeep;
	var stageLeft = 0;
	var stageRight = canvas.width;
	// access to pools
	var planePool = objectPool.planePool;
	var tankPool = objectPool.tankPool;
	var jeepPool = objectPool.jeepPool;
	// number of seconds between firing
	var fireFrequency = -1;
	var frameCounter = -1;
	// get reference to global randomMe method
	var randomMe = window.randomMe;

	// ------------------------------------------------------ public methods
	this.startMe = function(startX) {
		// initialization
		landscape = window.landscape;
		frameCounter = 0;
		fireFrequency = 10;
		// bunker type specific adjustments
		if (this.type == "RedBunker") {
			enemyPlane = "BluePlane";
			enemyTank = "BlueTank";
			enemyJeep = "BlueJeep";
		} else {
			enemyPlane = "RedPlane";
			enemyTank = "RedTank";
			enemyJeep = "RedJeep";
		}

		// positioning
		clip.x = startX;
		clip.y = 458;
		clip.gotoAndStop(this.type);
		stage.addChild(clip);
		turretClip.x = clip.x + 14;
		turretClip.y = clip.y;
		stage.addChild(turretClip);
	};

	this.removeMe = function(){
		stage.removeChild(clip);
		stage.removeChild(turretClip);
		objectPool.dispose(this);
	};

	this.airFireMe = function() {
		var r = Math.floor(turretClip.rotation);
		// random adjustment
		r = r + randomMe(-15,15);
		// get bullet object and start it
		var bullet = objectPool.getBullet();
		bullet.type = "Bullet";
		bullet.owner = this.type;
		// adjustments for specific bunkers
		var bulletSpeed = this.bulletSpeed;
		bullet.startMe(this, turretClip.x, turretClip.y, (cosTable[r] * bulletSpeed), (sinTable[r] * bulletSpeed));
	};

	this.groundFireMe = function() {
		// get bullet object and start it
		var bullet = objectPool.getBullet();
		bullet.type = "Bullet";
		bullet.owner = this.type;
		// adjustments for specific bunkers
		var bulletStartX = -1;
		var bulletStartY = clip.y + 18;
		var bulletSpeed = this.bulletSpeed;
		if (this.type == "BlueBunker"){
			bulletStartX = clip.x - 2;
			bulletSpeed = this.bulletSpeed * -1;
		} else {
			bulletStartX = clip.x + 42;
		}
		bullet.startMe(this, bulletStartX, bulletStartY, bulletSpeed, 0);
	};

	this.updateMe = function(){
        var dif = 0;

		// move clip in relation to landscape scroll displacement
		clip.x = clip.x - landscape.getScrollDisplace();
		turretClip.x = turretClip.x - landscape.getScrollDisplace();
		// turret tracking on enemyPlane
		var airTargetInRange = false;
		var length = planePool.length;
		for (var n=0; n<length; n++) {
			var plane = planePool[n];
			if ((plane.used) && (plane.type == enemyPlane)) {
				// calculate distance between each bunker and potential target
				dif = -1;
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
						airTargetInRange = true;
						break;
					}
				}
			}
		}

		// Attack enemy ground vehicles - can I fire on a target now (plane/jeep/tank)?
		if (frameCounter >= fireFrequency) {
			length = tankPool.length;
			for (n=0; n<length; n++) {
				var tank = tankPool[n];
				if ((tank.used) && (tank.state >= TankState.MOVING) && (tank.type == enemyTank)) {
					var tankClip = tank.clip;
					dif = clip.x - tankClip.x;
					// fire at targets 300 pixels away or less
					if ((dif > -300) && (dif < 300)) {
						this.groundFireMe();
						frameCounter = 0;
						break;
					}
				}
				var jeep = jeepPool[n];
				if ((jeep.used) && (jeep.state >= JeepState.MOVING) && (jeep.type == enemyJeep)) {
					var jeepClip = jeep.clip;
					dif = clip.x - jeepClip.x;
					// fire at targets 300 pixels away or less
					if ((dif > -300) && (dif < 300)) {
						this.groundFireMe();
						frameCounter = 0;
						break;
					}
				}
			}
			// can I fire on target now?
			if (airTargetInRange) {
				this.airFireMe();
				frameCounter = 0;
			}
		}
		frameCounter++;
	};
};
