var Cloud = function() {
	// private game variables
	var stage = window.stage;
	var assetManager = window.assetManager;
	var objectPool = window.objectPool;

	// public properties
	this.type = "Cloud";
	this.used = false;
	this.usedIndex = -1;
	this.poolIndex = -1;

	// others
	var canvas = window.canvas;
	var stageRight = canvas.width + 10;
	var speed;
	// reference to the landscape object to get ground scrolling
	var landscape;
	// reference to sky where clouds are dropped
	var sky;
	// get reference to global randomMe method
	var randomMe = window.randomMe;
    
    var sndWind = null;
    var windPlaying = false;

	// grab clip for clouds
	var clip = assetManager.getClip("Clouds");

	// ------------------------------------------------------ private methods
	function refreshMe(side){
		// randomly selected speed / positioning
		speed = randomMe(1,2);
		if (side == 1) clip.x = stageRight + 1;
		else clip.x = -180;
		clip.y = randomMe(10,300);
		clip.gotoAndStop("cloud" + randomMe(1,3));
	}

	// ------------------------------------------------------ public methods
	//this.startMe = function(myLandscape, startX) {
	this.startMe = function(startX) {
		// initialization
		landscape = window.landscape;
		sky = window.sky;
		refreshMe();
		if (startX !== undefined) clip.x = startX;
		sky.addChild(clip);
	};

	this.updateMe = function(){
		// move cloud by speed and in relation to landscape scroll displacement
		if (landscape !== undefined) clip.x = clip.x - speed - landscape.getScrollDisplace();
		else clip.x = clip.x - speed;
		// refresh the cloud if off the left of the stage
		if (clip.x < -186) {
            refreshMe(1);
            
            // play wind sound effect (33% chance) when cloud refreshed back to the right off stage
            if ((!windPlaying) && (randomMe(1,3) == 1)) {
                sndWind = createjs.Sound.play("Wind");
                windPlaying = true;
            }
            // resetting flag
            if ((sndWind != null) && (sndWind.playState == createjs.Sound.PLAY_FINISHED)) windPlaying = false;
            
        }
		if (clip.x > 900) refreshMe(-1);
	};
};
