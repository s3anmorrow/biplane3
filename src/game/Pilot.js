var Pilot = function() {
	// private game variables
	var stage = window.stage;
	var assetManager = window.assetManager;
	var objectPool = window.objectPool;

	// public properties
	this.type = "";
	this.used = false;
	this.usedIndex = -1;
	this.poolIndex = -1;

	// others
	// reference to the plane object this pilot object is controlling
	var myPlane = null;
	// reference to the redPlane (enemy)
	var redPlane = null;
	// reference to the landscape object to move plane according to it
	var landscape;
	// get reference to global randomMe method
	var randomMe = window.randomMe;

	// ------------------------------------------------------ public methods
	this.startMe = function(myBluePlane) {
		// initialization
		myPlane = myBluePlane;
		// gain access to global objects
		landscape = window.landscape;
		redPlane = window.redPlane;

		// start the plane
		myPlane.startMe();
		// adjust properties specific for AI BluePlane
		myPlane.pilot = this;
		myPlane.state = PlaneState.FLYING;
		myPlane.cruiseSpeed = 4;
		myPlane.rotateIncrement = 4;
		myPlane.bulletMax = 1;
		myPlane.bulletSpeed = 10;
		myPlane.setFacing(-1);
		if (this.type == "GamePilot") {
			if (redPlane.facing == -1) {
				// plane comes out left side
				myPlane.setFacing(1);
				myPlane.clip.x = -200;
			} else {
				// plane comes out right side
				myPlane.clip.x = 1000;
			}
			myPlane.clip.y = randomMe(50,200);
		} else if (this.type == "WinPilot") {
			myPlane.cruiseSpeed = 5;
			myPlane.clip.x = 875;
			myPlane.clip.y = 100;
			myPlane.loadBomb();
		}
	};

	this.removeMe = function(){
		this.killMe();
	};

	this.killMe = function(){
		// return this object to the object pool
		objectPool.dispose(this);
	};

	//var pullout = false;
	//var targetAngle = 0;
	this.updateMe = function(){
		if (this.type == "GamePilot") {
			// move piloted plane in relation to landscape scroll displacement
			myPlane.clip.x = myPlane.clip.x - landscape.getScrollDisplace();

			// track enemy redPlane
			var myPlaneClip = myPlane.clip;
			var redPlaneClip = redPlane.clip;
			// which way is plane facing?
			var facing = myPlane.facing;
			// get currentAngle of myPlane
			var currentAngle = myPlaneClip.rotation;
			// get targetAngle of RedPlane relative to myPlane
			var targetAngle = 180 + (Math.atan2(myPlaneClip.y - redPlaneClip.y, myPlaneClip.x - redPlaneClip.x) * 57.2957795);

			// to counter plane getting wobbly (up and down rotation over and over again)
			var adjust = 5;
			if (facing == 1) adjust = -5;
			var calc = currentAngle - targetAngle + 360;
			// which direction to rotate?
			if (((calc - adjust) % 360) > 180) {
				myPlane.rotateDown();
			} else if (((calc + adjust) % 360) < 180) {
				myPlane.rotateUp();
			}

			// only fire if plane is not killed
			if ((redPlane.state >= PlaneState.LANDED) && (myPlaneClip.x > 100) && (myPlaneClip.x < 700)) {
				var dif = Math.abs(currentAngle - targetAngle);
				// is the redPlane in firing range?
				if ((facing == -1) && (dif < 190) && (dif > 170)) {
					myPlane.spaceMe();
				} else if ((dif < 5) || (dif > 355)) {
					myPlane.spaceMe();
				}
			}

		} else if (this.type == "WinPilot") {
			// drop bomb on redBase to end the game
			if (myPlane.clip.x <= 100) myPlane.bombMe();
			// is the blue plane off the screen? If so remove
			if (myPlane.clip.x < -100) myPlane.removeMe();
		}
	};

};
