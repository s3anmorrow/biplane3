var Balloon = function() {
	// balloon state constants
	var KILLED = BalloonState.KILLED;
	var LANDED = BalloonState.LANDED;
	var FLYING = BalloonState.FLYING;
	// private game variables
	var stage = window.stage;
	var assetManager = window.assetManager;
	var objectPool = window.objectPool;

	// public properties
	this.type = "Balloon";
	this.used = false;
	this.usedIndex = -1;
	this.poolIndex = -1;
	this.clip = assetManager.getClip("Balloon");
	// state of balloon
	this.state = -1;

	// others
	// reference to the landscape object to get ground scrolling
	var landscape;
	// starting x location of this object
	var startX = 0;
	// speed of balloon
	var speed = 0.5;
	var me = this; // access to this object from callbacks [out of scope issues]
	// grab clip for base
	var clip = this.clip;

	// construct custom event object for plane being killed
	var eventKilled = new createjs.Event("onGameEvent", true);
	eventKilled.source = this;
	eventKilled.id = "balloonKilled";
	var eventFreeLife = new createjs.Event("onGameEvent", true);
	eventFreeLife.source = this;
	eventFreeLife.id = "freeLife";

	// ------------------------------------------------------ event handlers
	function onKilled(bitmap, animation) {
		// balloon has been killed (killed animation is complete)
        clip.removeEventListener("animationend", onKilled);
		clip.stop();
        clip.dispatchEvent(eventKilled);
		//stage.removeChild(clip);
	}

	// ------------------------------------------------------ public methods
	this.startMe = function(myStartX) {
		// initialization
		landscape = window.landscape;
		startX = myStartX;
		clip.x = startX;
		this.resetMe();
	};

	this.removeMe = function(){
		stage.removeChild(clip);
		objectPool.dispose(this);
	};

	this.resetMe = function() {
		this.state = LANDED;
		// reset y positioning
		clip.y = 424;
		clip.gotoAndStop("main");
		// add to stage if not there already
		if (!stage.contains(clip)) stage.addChild(clip);
	};

	this.release = function() {
		this.state = FLYING;
	};

	this.killMe = function(freeLife) {
		if (this.state != KILLED) {
			// kill the balloon object
			this.state = KILLED;
			// listen for when animation is complete
            clip.addEventListener("animationend", onKilled);
			clip.gotoAndPlay("killed");
			if (freeLife === true) clip.dispatchEvent(eventFreeLife);
			createjs.Sound.play("Explosion2");
		}
	};

	this.updateMe = function(){
		// move prison in relation to landscape scroll displacement
		clip.x = clip.x - landscape.getScrollDisplace();
		// make balloon rise
		if (this.state == FLYING) {
			clip.y -= speed;
			if (clip.y < -800) this.resetMe();
		}
	};
};

var BalloonState = {
	"KILLED":-1,
	"LANDED":0,
	"FLYING":1
};
