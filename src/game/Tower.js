var Tower = function() {
	// private game variables
	var stage = window.stage;
	var assetManager = window.assetManager;
	var objectPool = window.objectPool;

	// public properties
	this.type = "Tower";
	this.used = false;
	this.usedIndex = -1;
	this.poolIndex = -1;
	this.clip = assetManager.getClip("Misc");

	// others
	// reference to the landscape object to get ground scrolling
	var landscape;

	// grab clip for obstacle
	var clip = this.clip;

	// ------------------------------------------------------ public methods
	this.startMe = function(startX) {
		// initialization
		landscape = window.landscape;
		// positioning
		clip.x = startX;
		clip.y = 443;
		clip.gotoAndStop("tower");
		stage.addChild(clip);
	};

	this.removeMe = function(){
		stage.removeChild(clip);
		objectPool.dispose(this);
	};

	this.updateMe = function(){
		// move tower in relation to landscape scroll displacement
		clip.x = clip.x - landscape.getScrollDisplace();
	};

};
