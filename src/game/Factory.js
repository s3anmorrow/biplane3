var Factory = function() {
	// factory state constants
	var KILLED = FactoryState.KILLED;
	var WORKING = FactoryState.WORKING;

	// private game variables
	var stage = window.stage;
	var assetManager = window.assetManager;
	var objectPool = window.objectPool;

	// public properties
	this.type = "";
	this.used = false;
	this.usedIndex = -1;
	this.poolIndex = -1;
	this.tanks = -1;
	this.jeeps = -1;
	this.bombs = -1;
	this.workers = -1;
    this.menuShowing = false;
	// state of factory
	this.state = -1;
	// array queue of stuff to build in factory
	this.queue = [];
	this.clip = assetManager.getClip("Factory");
	this.smokeClip = assetManager.getClip("Factory");
	this.menuClip1 = assetManager.getClip("FactoryMenu");
	this.menuClip2 = assetManager.getClip("FactoryMenu");
	this.menuClip3 = assetManager.getClip("FactoryMenu");
	this.menuClip4 = assetManager.getClip("FactoryMenu");

	// container object to contain all scoreboard objects
	var menu = new createjs.Container();
	// others
	var me = this;
	// reference to the landscape object to get ground scrolling
	var landscape;
	// can factory produce bombs?
	var bombsEnabled = false;
	// how often does factory produce an item in the queue
	var assemblyLineFreq = 2 * GameConstants.FRAME_RATE;
	// frequency of red factory production
	var redProductionFreq = 0;
	// the delay between production for blue factory
	var blueProductionDelay = -1;
	// the amount of jeeps / tanks to produce during each "burst"
	var blueProductionTotal = -1;
	var frameCounter;
	var dropSpotX = 0;
	var dropSpotY = 0;
	// access to redplane
	var redPlane = objectPool.planePool[0];
	// get reference to global randomMe method
	var randomMe = window.randomMe;

	// grab clip for factory
	var clip = this.clip;
	var smokeClip = this.smokeClip;
	var menuClip1 = this.menuClip1;
	var menuClip2 = this.menuClip2;
	var menuClip3 = this.menuClip3;
	var menuClip4 = this.menuClip4;
	var queue = this.queue;

	// construct custom event object for plane being killed
	var eventKilled = new createjs.Event("onGameEvent", true);
	eventKilled.source = this;
	eventKilled.id = "factoryKilled";

	// ------------------------------------------------------ event handlers
	function onKilled(bitmap, animation) {
		// factory has been killed (killed animation is complete)
        clip.removeEventListener("animationend", onKilled);
		clip.gotoAndPlay(me.type + "Smolder");
		// dispatch eventKilled that the factory has been killed
		clip.dispatchEvent(eventKilled);
	}

	// ------------------------------------------------------ private methods
	function renderDigits(myDigit,enabled) {
		// get string equivalent and go through each letter
		var digit;
		var tempy = myDigit.toString();
		for (var n=0; n<tempy.length; n++) {
			digit = assetManager.getClip("Digits");
			if (tempy.charAt(n) == "/") digit.gotoAndStop("slash");
			else digit.gotoAndStop("digit" + tempy.charAt(n));
			digit.x = dropSpotX;
			digit.y = dropSpotY;
			if (enabled === false) digit.alpha = 0.3;
			menu.addChild(digit);
			dropSpotX = dropSpotX + 16;
		}
	}

	function refreshMenu() {
		var enabled;

		// clear out board container displayobjects
		menu.removeAllChildren();

		// add digit readouts
		dropSpotX = 43;
		dropSpotY = 17;
		renderDigits(me.workers);
		renderDigits("/");
		renderDigits(8);
		menuClip1.gotoAndStop("header");
		menuClip1.y = dropSpotY - 15;

		if (me.tanks === 0) enabled = false;
		else enabled = true;
		dropSpotX = 113;
		dropSpotY = 55;
		renderDigits(me.tanks, enabled);
		menuClip2.gotoAndStop("tankItem");
		menuClip2.y = dropSpotY - 7;
		if (!enabled) menuClip2.alpha = 0.3;
		else menuClip2.alpha = 1;

		if (me.jeeps === 0) enabled = false;
		else enabled = true;
		dropSpotX = 113;
		dropSpotY = 91;
		renderDigits(me.jeeps, enabled);
		menuClip3.gotoAndStop("jeepItem");
		menuClip3.y = dropSpotY - 7;
		if (!enabled) menuClip3.alpha = 0.3;
		else menuClip3.alpha = 1;

		if (me.bombs === 0) enabled = false;
		else enabled = true;
		dropSpotX = 113;
		dropSpotY = 124;
		renderDigits(me.bombs, enabled);
		menuClip4.gotoAndStop("bombItem");
		menuClip4.y = dropSpotY - 7;
		if (!enabled) menuClip4.alpha = 0.3;
		else menuClip4.alpha = 1;

		// add menuClips (menuItems) to menu
		menu.addChild(menuClip1);
		menu.addChild(menuClip2);
		menu.addChild(menuClip3);
		menu.addChild(menuClip4);
	}

	// ------------------------------------------------------ public methods
	this.startMe = function(startX) {
		// initialization
		this.state = WORKING;
		frameCounter = 0;
		bombsEnabled = false;
		blueProductionDelay = -1;
		blueProductionTotal = -1;
		// gain access to global objects
		landscape = window.landscape;
		// positioning
		clip.x = startX;
		clip.y = 403;
		clip.gotoAndStop(this.type);
		stage.addChild(clip);
		// position smoke
		smokeClip.x = startX;
		smokeClip.y = 403;
		if (this.type == "BlueFactory") {
			smokeClip.gotoAndPlay("BlueFactorySmoke");
			stage.addChild(smokeClip);
		}
		// position and show menu
		menu.x = 20;
		menu.y = 230;
		if (this.type == "RedFactory"){
			this.tanks = 0;
			this.jeeps = 0;
			this.bombs = 0;
			this.workers = 0;
			refreshMenu();
		}
		this.showMenu();
	};

	this.removeMe = function(){
		this.hideMenu();
		// empty out queue to battle memory leak and construct new array
		for (var n=0; n<queue.length; n++) queue[n] = null;
		queue = [];
		stage.removeChild(clip);
		stage.removeChild(smokeClip);
		objectPool.dispose(this);
	};

	this.killMe = function(){
		if (this.state != KILLED) {
			// stop the factory object
			this.state = KILLED;
			// remove smoke
			smokeClip.stop();
			stage.removeChild(smokeClip);
			// listen for when animation is complete
            clip.addEventListener("animationend", onKilled);
			clip.gotoAndPlay(this.type + "Kill");
			createjs.Sound.play("FactoryExplosion","none",200);
		}
	};

	this.highlightMe = function(which) {
		if ((which == "RedTank") && (this.tanks > 0)) menuClip2.gotoAndStop("tankItemDown");
		else if ((which == "RedJeep") && (this.jeeps > 0)) menuClip3.gotoAndStop("jeepItemDown");
		else if (this.bombs > 0) menuClip4.gotoAndStop("bombItemDown");
	};

	this.showMenu = function() {
		stage.addChild(menu);
        this.menuShowing = true;
	};

	this.hideMenu = function() {
		stage.removeChild(menu);
        this.menuShowing = false;
	};

	this.enableBombs = function() {
		bombsEnabled = true;
		this.bombs = 1;
		refreshMenu();
	};

	this.adjustWorkers = function(value){
		this.workers = this.workers + value;
		// turn on smoke?
		if (this.workers == 1) {
			smokeClip.gotoAndPlay("RedFactorySmoke");
			stage.addChild(smokeClip);
			redProductionFreq = GameConstants.RED_START_PRODUCTION_FREQ * GameConstants.FRAME_RATE;
		} else {
			// each worker added increases production freq
			redProductionFreq = (GameConstants.RED_START_PRODUCTION_FREQ - (this.workers * GameConstants.RED_PRODUCTION_PER_WORKER)) * GameConstants.FRAME_RATE;
		}

		console.log("redProductionFreq: " + redProductionFreq);

        refreshMenu();
	};

	this.autoProduction = function(delay, total){
		blueProductionDelay = delay;
		blueProductionTotal = total;
		// produce immediately and then wait delay to do it again
		for (var n=0; n<blueProductionTotal; n++) {
			if (randomMe(1,2) == 1) this.produce("BlueJeep");
			else this.produce("BlueTank");
		}
	};

	this.produce = function(vehicleType){
		if (stage.contains(menu)) {
			// reset all key down states
			menuClip2.gotoAndStop("tankItem");
			menuClip3.gotoAndStop("jeepItem");
			menuClip4.gotoAndStop("bombItem");

			if ((vehicleType == "BlueTank") || (vehicleType == "BlueJeep")) {
				queue.unshift(vehicleType);
			} else {
				// only if redPlane is landed at base
				if (stage.getChildIndex(menu) != -1) {
					if ((vehicleType == "RedTank") && (this.tanks > 0)) {
						this.tanks--;
						queue.unshift(vehicleType);
						refreshMenu();
						createjs.Sound.play("DeployVehicle");
					} else if ((vehicleType == "RedJeep") && (this.jeeps > 0)) {
						this.jeeps--;
						queue.unshift(vehicleType);
						refreshMenu();
						createjs.Sound.play("DeployVehicle");
					} else if ((vehicleType == "RedBomb") && (this.bombs > 0)) {
						if (!redPlane.bombLoaded) {
							this.bombs--;
							// load the redPlane
							redPlane.loadBomb();
							refreshMenu();
							createjs.Sound.play("DeployVehicle");
						}
					}
				}
			}

			console.log(this.type + " queue: " + queue);
		}
	};

	this.updateMe = function(){
		// move obstacle in relation to landscape scroll displacement
		clip.x = clip.x - landscape.getScrollDisplace();
		smokeClip.x = smokeClip.x - landscape.getScrollDisplace();
		if (this.state == WORKING) {
			// production of vehicles at factory
			if (this.type == "RedFactory"){
				// add another vehicle to factory stock at red factory?
				if ((this.workers > 0) && (frameCounter % redProductionFreq === 0)) {
					if (randomMe(1,2) == 1) this.jeeps++;
					else this.tanks++;
					// maximum of 30 of each allowed
					if (this.jeeps > 20) this.jeeps = 20;
					if (this.tanks > 20) this.tanks = 20;
					if (bombsEnabled) this.bombs++;
					if (this.bombs > 10) this.bombs = 10;
					refreshMenu();
				}
			}

			// time for blue base to manufacture?
			if ((blueProductionDelay != -1) && (frameCounter % blueProductionDelay === 0)) {
				for (var n=0; n<blueProductionTotal; n++) {
					if (randomMe(1,2) == 1) this.produce("BlueJeep");
					else this.produce("BlueTank");
				}
			}

			// adding vehicles to the game?
			if (queue.length > 0) {
				if (frameCounter % assemblyLineFreq === 0) {
					var vehicleType = queue[queue.length - 1];
					var vehicle;
					var startX;
					if ((vehicleType == "RedTank") || (vehicleType == "BlueTank")) vehicle = objectPool.getTank();
					else vehicle = objectPool.getJeep();
					if (this.type == "RedFactory") startX = clip.x + 100;
					else startX = clip.x + 35;
					// set type of vehicle and start it up
					vehicle.type = vehicleType;
					vehicle.startMe(startX, stage.getChildIndex(this.clip));
					// remove vehicle from the queue
					queue.pop();

					console.log("dropping " + vehicleType + " : in queue " + queue);
				}
			}
			frameCounter++;
		}
	};

};

var FactoryState = {
	"KILLED":-1,
	"WORKING":0,
};
