var Survivor = function() {
	// constants
	var WALK_SPEED = 0.5;
	var RUN_SPEED = 1;
	// survivor states
	var KILLED = SurvivorState.KILLED;
	var WANDERING = SurvivorState.WANDERING;
	var BOARDING = SurvivorState.BOARDING;
	var TRANSIT = SurvivorState.TRANSIT;
	var UNBOARDING = SurvivorState.UNBOARDING;
	var SAVED = SurvivorState.SAVED;

	// private game variables
	var stage = window.stage;
	var assetManager = window.assetManager;
	var objectPool = window.objectPool;

	// public properties
	this.type = "Survivor";
	this.used = false;
	this.usedIndex = -1;
	this.poolIndex = -1;
	this.clip = assetManager.getClip("Survivor");
	this.alertClip = assetManager.getClip("Digits");
	// state of survivor - 0:wandering / 1:boarding plane / 2:returning
	this.state = -1;

	// others
	// reference to the landscape object to get ground scrolling
	var landscape;
	// reference to the redPlane object
	var redPlane;
	// reference to redFactory object
	var redFactory;
	// reference to the prison the survivor belongs to
	var speed = -1;
	// 1 for right and -1 for left
	var direction = 1;
	var wanderDistance = 0;
	var distance = 0;
	var planeX = 0;
	// get reference to global randomMe method
	var randomMe = window.randomMe;
	// counter for how long alert stays on the screen
	var alertCounter = 0;
	var alertSpan = 4 * GameConstants.FRAME_RATE;
	// reference to this object
	var me = this;

	// grab clip for base
	var clip = this.clip;
	var alertClip = this.alertClip;

	// construct custom event object
	var eventSaved = new createjs.Event("onGameEvent", true);
	eventSaved.source = this;
	eventSaved.id = "survivorSaved";
	// construct custom event object for plane being killed
	var eventKilled = new createjs.Event("onGameEvent", true);
	eventKilled.source = this;
	eventKilled.id = "survivorKilled";

	// ------------------------------------------------------ event handlers
	function onKilled(bitmap, animation) {
		// plane has been killed (killed animation is complete)
        clip.removeEventListener("animationend", onKilled);
		clip.y = -1000;
		// memory management
		stage.removeChild(clip);
		stage.removeChild(alertClip);
		// return this object to the object pool
		objectPool.dispose(me);
	}

	// ------------------------------------------------------ public methods
	this.startMe = function(myStartX) {
		// initialization
		landscape = window.landscape;
		redPlane = window.redPlane;
		redFactory = window.redFactory;
		// positioning
		clip.x = myStartX + 2;
		clip.y = 475;
		clip.gotoAndPlay("walkRight");
		stage.addChild(clip);
		alertClip.y = clip.y - 28;
		alertClip.visible = false;
		stage.addChild(alertClip);
		// default state is wandering
		this.wanderMe();
	};

	this.killMe = function() {
		if (this.state != KILLED) {
            stage.dispatchEvent(eventKilled);
			// change state
			this.state = KILLED;
			if (!stage.contains(clip)) {
                createjs.Sound.play("SurvivorKilled");
				// survivor is on board a plane but has died in the crash
				this.removeMe();
			} else {
				// play killed animation
                clip.addEventListener("animationend", onKilled);
				clip.gotoAndPlay("killed");
				createjs.Sound.play("SurvivorKilled");
			}
		}
	};

	this.removeMe = function(){
		clip.y = -1000;
		this.state = KILLED;
		stage.removeChild(clip);
		stage.removeChild(alertClip);
		objectPool.dispose(this);
	};

	this.wanderMe = function() {
		this.state = WANDERING;
		speed = WALK_SPEED;
		// randomly select startup wander direction
		direction = 1;
		if (randomMe(0,1) === 0) direction = -1;
		wanderDistance = 0;
		distance = 0;
	};

	this.boardMe = function() {
		// get survivor to board plane
		this.state = BOARDING;
		speed = RUN_SPEED;
		planeX = redPlane.clip.x;
		baseX = redFactory.clip.x;
		// which direction to go?
		if (planeX > clip.x) {
			direction = 1;
			alertClip.x = clip.x - 7;
			clip.gotoAndPlay("walkRight");
		} else {
			direction = -1;
			alertClip.x = clip.x - 11;
			clip.gotoAndPlay("walkLeft");
		}
		// drop alert clip onto stage
		alertClip.gotoAndStop("exclamation");
		alertCounter = 0;
		alertClip.visible = true;
		createjs.Sound.play("SurvivorBoarding");
	};

	this.unBoardMe = function() {
		direction = -1;
		speed = RUN_SPEED;
		this.state = UNBOARDING;
		clip.x = redPlane.clip.x;
		clip.y = 475;
		clip.gotoAndPlay("walkLeft");
		redPlane.unLoadMe();
		stage.addChild(clip);
	};

	this.updateMe = function(){
		if (this.state == TRANSIT) {
			return;
		} else if (this.state == WANDERING) {
			// move base in relation to landscape scroll displacement
			clip.x = clip.x + (speed * direction) - landscape.getScrollDisplace();
			// wandering effect of survivors
			if (distance >= wanderDistance) {
				// reverse direction and recalculate new random wander distance
				direction = direction * -1;
				if (direction == 1) clip.gotoAndPlay("walkRight");
				else clip.gotoAndPlay("walkLeft");
				// setup new wanderDistance
				if (distance > 0) wanderDistance = distance;
				else wanderDistance = randomMe(30,60);
				distance = 0;
			}
			distance = distance + speed;
		} else if (this.state == BOARDING) {
			// move base in relation to landscape scroll displacement
			clip.x = clip.x + (speed * direction) - landscape.getScrollDisplace();
			// check if survivor has boarded yet
			if (((direction == 1) && (clip.x >= planeX)) || ((direction == -1) && (clip.x <= planeX))) {
				// remove survivor from stage
				clip.y = -1000;
				stage.removeChild(clip);
				redPlane.loadMe(this);
				alertClip.visible = false;
				this.state = TRANSIT;
			}
			// check if redPlane takes off prematurely
			if (redPlane.state !== 0) {
				this.wanderMe();
				alertCounter = 0;
				alertClip.gotoAndStop("question");
				alertClip.visible = true;
				createjs.Sound.play("SurvivorBoarding");
			}
		} else if (this.state == UNBOARDING) {
			// move base in relation to landscape scroll displacement
			clip.x = clip.x + (speed * direction) - landscape.getScrollDisplace();
			// check if survivor ready to enter base
			if (clip.x <= (redFactory.clip.x + 12)) {
				// dispatch eventSaved
				clip.dispatchEvent(eventSaved);
                // remove survivor from game
				this.removeMe();
			}
		} else if (this.state == KILLED) {
			// still need to scroll relative to landscape
			clip.x = clip.x - landscape.getScrollDisplace();
		}

		// do I need to turn off an alert clip?
		if (alertClip.visible === true) {
			// move alertClip to match survivor's clip
			if (direction == 1) alertClip.x = clip.x - 7;
			else alertClip.x = clip.x - 11;
			// increment counter to find out if I have to turn it off
			alertCounter++;
			if (alertCounter >= alertSpan) {
				alertCounter = 0;
				alertClip.visible = false;
			}
		}
	};

};

var SurvivorState = {
	"KILLED":-1,
	"WANDERING":0,
	"BOARDING":1,
	"TRANSIT":2,
	"UNBOARDING":3,
	"SAVED":4
};
