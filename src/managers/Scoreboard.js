var Scoreboard = function() {
	// constants
	var STARTING_LIVES = GameConstants.STARTING_LIVES;

	// public properties
	this.lives = -1;
	this.saves = -1;
	this.deaths = -1;
	this.kills = -1;

	// private game variables
	var assetManager = window.assetManager;

	// get icon clips
	var iconLives = assetManager.getClip("Icons");
	iconLives.gotoAndStop("lives");
	var iconSaves = assetManager.getClip("Icons");
	iconSaves.gotoAndStop("saves");
	var iconDeaths = assetManager.getClip("Icons");
	iconDeaths.gotoAndStop("deaths");
	var iconKills = assetManager.getClip("Icons");
	iconKills.gotoAndStop("kills");
	// container object to contain all scoreboard objects
	var board = new createjs.Container();

	// other
	var me = this;
	var dropSpot = 0;
	var iconSpacer = 3;
	var readingSpacer = 8;

	// ------------------------------------------------------ private methods
	function renderDigits(myDigit) {
		// get string equivalent and go through each letter
		var digit;
		var tempy = myDigit.toString();
		for (var n=0; n<tempy.length; n++) {
			digit = assetManager.getClip("Digits");
			digit.gotoAndStop("digit" + tempy.charAt(n));
			digit.x = dropSpot;
			digit.y = 0;
			board.addChild(digit);
			dropSpot = dropSpot + 16;
		}
	}

	function refreshMe() {
		// clear out board container displayobjects
		board.removeAllChildren();

		// rebuild scoreboard from scratch
		iconLives.x = 0;
		board.addChild(iconLives);
		dropSpot = 31 + iconSpacer;
		renderDigits(me.lives);

		iconSaves.x = dropSpot + readingSpacer;
		board.addChild(iconSaves);
		dropSpot = dropSpot + 31 + iconSpacer - 6;
		renderDigits(me.saves);

		iconDeaths.x = dropSpot + readingSpacer;
		board.addChild(iconDeaths);
		dropSpot = dropSpot + 31 + iconSpacer - 7;
		renderDigits(me.deaths);

		iconKills.x = dropSpot + readingSpacer;
		board.addChild(iconKills);
		dropSpot = dropSpot + 31 + iconSpacer - 3;
		renderDigits(me.kills);
	}

	// ------------------------------------------------------ public methods
	this.startMe = function() {
		// positioning and adding to the stage
		board.x = 10;
		board.y = 10;
		this.resetMe();
		stage.addChild(board);
	};

	this.removeMe = function() {
		stage.removeChild(board);
	};

	this.adjustLives = function(value){
		this.lives = this.lives + value;
		refreshMe();
	};

	this.adjustSaves = function(value){
		this.saves = this.saves + value;
		refreshMe();
	};

	this.adjustDeaths = function(value){
		this.deaths = this.deaths + value;
		refreshMe();
	};

	this.adjustKills = function(value){
		this.kills = this.kills + value;
		refreshMe();
	};

	this.resetMe = function() {
		this.lives = STARTING_LIVES;
		this.saves = 0;
		this.deaths = 0;
		this.kills = 0;
		refreshMe();
	};
};
