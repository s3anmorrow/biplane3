// this object uses the module pattern instead of the constructor pattern
var Landscape = function() {
	// landscape state constants
	var RESETTING = LandscapeState.RESETTING;
	var PLAYING = LandscapeState.PLAYING;
	var KILLED = LandscapeState.KILLED;

	// private game variables
	var stage = window.stage;
	var assetManager = window.assetManager;
	var objectPool = window.objectPool;

	// public properties
	this.type = "Landscape";
	this.used = false;
	this.usedIndex = -1;
	// state of landscape
	this.state = KILLED;

	// grab all clips from AssetManager
	this.ground = assetManager.getClip("Ground");
	this.hills = assetManager.getClip("Hills");
	this.redFlag = assetManager.getClip("Flags");
	this.blueFlag = assetManager.getClip("Flags");

	// construct custom event object for when landscape is reset
	var eventReset = new createjs.Event("onGameEvent", true);
	eventReset.source = this;
	eventReset.id = "landscapeReset";

	var eventDropDistance = new createjs.Event("onGameEvent", true);
	eventDropDistance.source = this;
	eventDropDistance.id = "dropDistance";

	// local variable references for speedier access
	var ground = this.ground;
	var hills = this.hills;
	var redFlag = this.redFlag;
	var blueFlag = this.blueFlag;

	// other
	// target distance for dropping bluePlane
	var dropDistance = -1;
	// distance counter for dropping bluePlanes
	var distance = -1;
	// redplane object which controls scrolling of ground
	var redPlane = null;
	// the amount the ground is currently scrolling if any (0 if no scroll)
	var scrollDisplace = 0;
	// resetting the landscape by scrolling back to home base
	var resetFirstIncrement = -1;
	var resetIncrementCount = -1;
	var resetCounter = -1;

	// ------------------------------------------------------ public methods
	//this.getX = function() {return ground.x}
	this.getScrollDisplace = function() {return scrollDisplace;};
	this.setDropDistance = function(value) {
		dropDistance = value;
		// reset distance counter
		distance = 0;
	};

	this.startMe = function() {
		// get global reference to redPlane - redplane is a crucial object to control scrolling of level
		redPlane = window.redPlane;
		this.state = PLAYING;
		frameCounter = 0;
		distance = 0;
		dropDistance = -1;
		// position assets
		ground.x = 0;
		ground.y = 485;
		hills.x = 0;
		hills.y = 425;
		redFlag.x = 600;
		redFlag.y = 434;
		redFlag.gotoAndPlay("redFlag");
		blueFlag.x = 4520;
		blueFlag.y = 434;
		blueFlag.gotoAndPlay("blueFlag");

		// add assets to stage
		stage.addChild(ground);
		stage.addChild(hills);
		stage.addChild(redFlag);
		stage.addChild(blueFlag);
	};

	this.removeMe = function() {
		// initialization
		this.state = KILLED;
		stage.removeChild(ground);
		stage.removeChild(hills);
		stage.removeChild(redFlag);
		stage.removeChild(blueFlag);
	};

	this.resetMe = function() {
		this.state = PLAYING;
		scrollDisplace = 0;
	};

	this.rewindMe = function() {
		// initialize reset scroll back
		resetCounter = 0;
		// how far to scroll back on the first increment (the fractional distance)
		resetFirstIncrement = (ground.x % 40);
		// how many other increments are required (scroll back by 40 pixels each increment)
		resetIncrementCount = Math.floor((ground.x * -1) / 40) + 1;
		this.state = RESETTING;
	};

	this.updateMe = function(){
		if (this.state == PLAYING) {
			// landscape is playing
			var state = redPlane.state;
			var x = redPlane.clip.x;

			// assume the level isn't scrolling at all
			scrollDisplace = 0;
			// scroll ground if redPlane flying, landing, stalling, or taking off
			if (state > PlaneState.LANDED) {
				if (x >= 550) {
					// scrolling right
					if (ground.x > -4000) {
						redPlane.clip.x = 550;
						scrollDisplace = redPlane.getXDisplace();
					}
					// stop scrolling by going just a little bit more to the max
					if ((ground.x - scrollDisplace) < -4000) {
						scrollDisplace = ground.x + 4000;
					}
					ground.x = ground.x - scrollDisplace;
					hills.x = hills.x - scrollDisplace;
					redFlag.x = redFlag.x - scrollDisplace;
					blueFlag.x = blueFlag.x - scrollDisplace;
				} else if (x <= 250) {
					// scrolling left
					if (ground.x < 0) {
						redPlane.clip.x = 250;
						scrollDisplace = redPlane.getXDisplace();
					}
					// stop scrolling by going just a little bit more to the min
					if ((ground.x - scrollDisplace) > 0) {
						scrollDisplace = ground.x;
					}
					ground.x = ground.x - scrollDisplace;
					hills.x = hills.x - scrollDisplace;
					redFlag.x = redFlag.x - scrollDisplace;
					blueFlag.x = blueFlag.x - scrollDisplace;
				}
			}

			// keep track of how much distance travelled if required to monitor at current level
			if (dropDistance == -1) return;
			if (scrollDisplace < 0) distance = distance + (scrollDisplace * -1);
			else distance = distance + scrollDisplace;
			// should I be dropping a new blue plane into the game?
			if (distance > dropDistance) {
				// clear out distance
				distance = 0;
				ground.dispatchEvent(eventDropDistance);
			}
		} else if (this.state == RESETTING) {
			// landscape is resetting - move landscape back to base
			// first increment is the fractional one and all others are 40 pixels to get everything back
			if (resetCounter === 0) scrollDisplace = resetFirstIncrement;
			else scrollDisplace = -40;
			// have we scrolled back enough?
			if (resetCounter >= resetIncrementCount) {
				this.state = PLAYING;
				scrollDisplace = 0;
				distance = 0;
				// dispatch event that the landscape is ready again
				ground.dispatchEvent(eventReset);
			} else {
				ground.x = ground.x - scrollDisplace;
				hills.x = hills.x - scrollDisplace;
				redFlag.x = redFlag.x - scrollDisplace;
				blueFlag.x = blueFlag.x - scrollDisplace;
			}
			resetCounter++;
		}
	};

};

var LandscapeState = {
	"RESETTING":-1,
	"PLAYING":1,
	"KILLED":0
};
