var Prison = function() {
	// prison state constants
	var NORMAL = PrisonState.NORMAL;
	var BROKEN = PrisonState.BROKEN;
	// private game variables
	var stage = window.stage;
	var assetManager = window.assetManager;
	var objectPool = window.objectPool;

	// public properties
	this.type = "Prison";
	this.used = false;
	this.usedIndex = -1;
	this.poolIndex = -1;
	this.clip = assetManager.getClip("Prison");
	// state of prison - 0:normal / 1:broken
	this.state = -1;

	// others
	// reference to the global game objects
	var landscape;
	// grab clip for base
	var clip = this.clip;
	var frameCounter;
	var breakAgain = false;
	var breakAgainPause = -1;
	var breakAgainCounter = -1;

	// construct custom event object for when prison is broken
	var eventBroken = new createjs.Event("onGameEvent", true);
	eventBroken.source = this;
	eventBroken.id = "prisonBroken";
	var eventBrokenAgain = new createjs.Event("onGameEvent", true);
	eventBrokenAgain.source = this;
	eventBrokenAgain.id = "prisonBrokenAgain";

	// ------------------------------------------------------ event handlers
	function onBroken(bitmap, animation) {
        clip.removeEventListener("animationend", onBroken);
		clip.gotoAndStop("broken");
		clip.dispatchEvent(eventBroken);
	}

	// ------------------------------------------------------ public methods
	this.startMe = function(myStartX) {
		// initialization
		landscape = window.landscape;
		this.state = NORMAL;
		frameCounter = 0;
		breakAgain = false;
		breakAgainCounter = 1;
		breakAgainPause = 8 * GameConstants.FRAME_RATE;
		// positioning
		clip.x = myStartX;
		clip.y = 451;
		clip.gotoAndStop("main");
		stage.addChild(clip);
	};

	this.removeMe = function(){
		stage.removeChild(clip);
		objectPool.dispose(this);
	};

	this.breakMe = function() {
		this.state = BROKEN;
        clip.addEventListener("animationend", onBroken);
		clip.gotoAndPlay("breakout");
		createjs.Sound.play("Explosion2");
	};

	this.breakAgain = function(){
		frameCounter = 0;
		breakAgain = true;
		breakAgainPause = (8 + (3 * breakAgainCounter)) * GameConstants.FRAME_RATE;
		breakAgainCounter++;
	};

	this.updateMe = function(){
		// move prison in relation to landscape scroll displacement
		clip.x = clip.x - landscape.getScrollDisplace();
		// am I breaking the prison again to release more prisoners (overtime)
		if (breakAgain) {
			// wait for a moment before breaking again
			if (frameCounter >= breakAgainPause){
				breakAgain = false;
				clip.dispatchEvent(eventBroken);
				clip.dispatchEvent(eventBrokenAgain);
			}
			frameCounter++;
		}
	};
};

var PrisonState = {
	"NORMAL":0,
	"BROKEN":1
};
