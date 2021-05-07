// AssetManager class
// Sean Morrow
// May 6 / 2014

var AssetManager = function() {
	// keep track of assets
    var manifest = null;
	var counter = -1;
	var total = -1;
	// array of spritesheet objects
	var spriteSheets = [];
	// preloader object
	preloader = new createjs.LoadQueue();

	// construct custom event object and initialize it
	var eventAssetLoaded = new createjs.Event("onAssetLoaded");
	var eventAllLoaded = new createjs.Event("onAssetsLoaded");
	var eventScreensLoaded = new createjs.Event("onScreensLoaded");

	// ------------------------------------------------------ event handlers
	onLoaded = function(e) {
		// what type of asset was loaded?
		switch(e.item.type) {
			case createjs.LoadQueue.IMAGE:
				// spritesheet loaded
				var source = e.item.src;
				var data = e.item.data;
                var framesData = null;

                if ((data.regPoint === undefined) && (data.width === undefined) && (data.height === undefined)) {
                    // the manifest contains a frames array (outlines dimensions, reg point, etc for EACH frame)
                    // this approach is used if you want to have ALL your assets in large files. Use CreateJS ZOE to generate the JSON
                    framesData = data.frames;
                } else {
                    // the manifest contains a frames object outlining properties of all frames in sprite
                    // determine registration point of sprite
                    var x = 0;
                    var y = 0;
                    if (data.regPoint == "center"){
                        x = Math.floor(data.width/2);
                        y = Math.floor(data.height/2);
                    }
                    // construct frames property object
                    framesData = {width:data.width, height:data.height, regX:x, regY:y};
                    // add in count property if provided
                    if (data.framecount !== undefined) framesData.count = data.framecount;
                }

                // construct Spritesheet object from source
				spriteSheet = new createjs.SpriteSheet({
                    images:[source],
					frames:framesData,
					animations: data.animations
				});

				// store spritesheet object for later retrieval
				spriteSheets[e.item.id] = spriteSheet;

				break;
			case createjs.LoadQueue.SOUND:
				// sound loaded
				break;
        }
        // keeping track of how many loaded?
        counter++;
        // an asset has been loaded
        stage.dispatchEvent(eventAssetLoaded);
        console.log("asset loaded: " + e.result.src);
	};

	//called if there is an error loading the spriteSheet (usually due to a 404)
	onError = function(e) {
		console.log("Preloader > Error Loading asset");
	};

	onComplete = function(e) {
		if (counter >= total) {
			// dispatch event that all assets are loaded
			stage.dispatchEvent(eventAllLoaded);
        }
	};

	onScreensComplete = function(e) {
		if (counter >= total) {
			// dispatch event that all assets are loaded
			stage.dispatchEvent(eventScreensLoaded);
        }
	};

	// ------------------------------------------------------ public methods
	this.getClip = function(id) {
		// construct sprite object to animate the frames (I call this a clip)
		var sprite = new createjs.Sprite(spriteSheets[id]);
		sprite.name = id;
		sprite.x = 0;
		sprite.y = 0;
		sprite.currentFrame = 0;
		return sprite;
	};

    this.getSpriteSheet = function(id) {
        return spriteSheets[id];
    };

	this.getProgress = function() {
		return (counter/total);
	};

    this.loadScreens = function(myScreenManifest) {
		// setup manifest
		manifest = myScreenManifest;
		counter = 0;
		total = 1;
		// setup event listeners
        preloader.addEventListener("fileload", onLoaded);
        preloader.addEventListener("error", onError);
        preloader.addEventListener("complete", onScreensComplete);
		// make it happen
		preloader.loadFile(manifest);
	};

	this.loadAssets = function(myManifest) {
		// setup manifest
        manifest = myManifest;
		counter = 0;
		total = manifest.length;
        // if browser doesn't suppot the ogg it will attempt to look for an mp3
        createjs.Sound.alternateExtensions = ["ogg"];
		// registers the PreloadJS object with SoundJS - will automatically have access to all sound assets
		preloader.installPlugin(createjs.Sound);
        preloader.addEventListener("fileload", onLoaded);
        preloader.addEventListener("error", onError);
        preloader.addEventListener("complete", onComplete);
		preloader.setMaxConnections(5);
		// load first spritesheet to start preloading process
		preloader.loadManifest(manifest);
	};
};
