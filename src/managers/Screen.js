var Screen = function() {
	// private game variables
	var stage = window.stage;
	var assetManager = window.assetManager;

	// public properties
	this.type = "Screen";
	this.instructPage = -1;

	// containers to contain all elements of each screen
	var preloadContainer, introContainer, instructContainer, creditsContainer, loseGameContainer, winGameContainer, backgroundContainer;
	// others
	var me = this;
	var progressBar;
	var instructionsIcon;
	var startIcon;
	var creditsIcon;
	var instructClip;
	var introMusicPlayed = false;
	var loseGameMusic;
	var winGameMusic;

	// ------------------------------------------------------ private methods
	function initPreload(){
		// construct container
		preloadContainer = new createjs.Container();
		var clip = assetManager.getClip("Screens");
		clip.x = 175;
		clip.y = 25;
		clip.gotoAndStop("Preload");
		// add progress bar back
		var progressBarBack = new createjs.Shape();
		progressBarBack.alpha = 0.3;
		progressBarBack.graphics.beginFill("#FFFFFF").drawRect(287,265,290,3);
		// add progress bar
		progressBar = new createjs.Shape();
		progressBar.graphics.beginFill("#FFFFFF").drawRect(287,265,0,3);

		preloadContainer.addChild(progressBarBack);
		preloadContainer.addChild(progressBar);
		preloadContainer.addChild(clip);
	}

	function initBackground(){
		// construct container
		backgroundContainer = new createjs.Container();
		// populate backgroundContainer
		var ground = assetManager.getClip("Ground");
		var hills = assetManager.getClip("Hills");
		var redFlag = assetManager.getClip("Flags");
		var factory = assetManager.getClip("Factory");
		var factorySmoke = assetManager.getClip("Factory");
		var bunker = assetManager.getClip("Misc");
		var turret = assetManager.getClip("Turret");
		ground.x = 0;
		ground.y = 485;
		hills.x = 0;
		hills.y = 425;
		redFlag.x = 600;
		redFlag.y = 434;
		redFlag.gotoAndPlay("redFlag");
		factory.x = 14;
		factory.y = 403;
		factory.gotoAndStop("RedFactory");
		factorySmoke.x = 14;
		factorySmoke.y = 403;
		factorySmoke.gotoAndPlay("RedFactorySmoke");
		bunker.x = 630;
		bunker.y = 458;
		bunker.gotoAndStop("RedBunker");
		turret.x = bunker.x + 14;
		turret.y = bunker.y;
		backgroundContainer.addChild(ground);
		backgroundContainer.addChild(hills);
		backgroundContainer.addChild(redFlag);
		backgroundContainer.addChild(factory);
		backgroundContainer.addChild(factorySmoke);
		backgroundContainer.addChild(bunker);
		backgroundContainer.addChild(turret);
	}

	function initIntro(){
		// construct container
		introContainer = new createjs.Container();
		var clip = assetManager.getClip("Screens");
		clip.x = 175;
		clip.y = 25;
		clip.gotoAndStop("Intro");
		// populate introContainer
		var redPlane = assetManager.getClip("Plane");
		var bluePlane = assetManager.getClip("Plane");
		instructionsIcon = assetManager.getClip("Icons");
		instructionsIcon.x = 313;
		instructionsIcon.y = 280;
		instructionsIcon.gotoAndStop("instructions");
		creditsIcon = assetManager.getClip("Icons");
		creditsIcon.x = 313;
		creditsIcon.y = 310;
		creditsIcon.gotoAndStop("credits");
		startIcon = assetManager.getClip("Icons");
		startIcon.x = 313;
		startIcon.y = 340;
		startIcon.gotoAndStop("start");
		redPlane.x = 155;
		redPlane.y = 185;
		redPlane.rotation = -45;
		redPlane.gotoAndPlay("RedPlaneRight");
		bluePlane.x = 645;
		bluePlane.y = 155;
		bluePlane.rotation = -20;
		bluePlane.gotoAndPlay("BluePlaneLeft");
		introContainer.addChild(redPlane);
		introContainer.addChild(bluePlane);
		introContainer.addChild(clip);
		introContainer.addChild(instructionsIcon);
		introContainer.addChild(creditsIcon);
		introContainer.addChild(startIcon);
	}

	function initInstruct() {
		// construct container
		instructContainer = new createjs.Container();
		instructClip = assetManager.getClip("Screens");
		instructClip.x = 175;
		instructClip.y = 25;
		instructContainer.addChild(instructClip);
	}

	function initCredits(){
		// construct container
		creditsContainer = new createjs.Container();
		var clip = assetManager.getClip("Screens");
		clip.x = 175;
		clip.y = 25;
		clip.gotoAndStop("Credits");
		creditsContainer.addChild(clip);
	}

	function initLoseGame(){
		// construct container
		loseGameContainer = new createjs.Container();
		var clip = assetManager.getClip("Screens");
		clip.x = 175;
		clip.y = 25;
		clip.gotoAndStop("LoseGame");
		loseGameContainer.addChild(clip);
	}

	function initWinGame(){
		// construct container
		winGameContainer = new createjs.Container();
		var clip = assetManager.getClip("Screens");
		clip.x = 175;
		clip.y = 25;
		clip.gotoAndStop("WinGame");
		winGameContainer.addChild(clip);
	}

	function removeAllScreens() {
		if (instructionsIcon !== undefined){
			instructionsIcon.gotoAndStop("instructions");
			startIcon.gotoAndStop("start");
			creditsIcon.gotoAndStop("credits");
		}
		if (stage.contains(preloadContainer)) stage.removeChild(preloadContainer);
		if (stage.contains(backgroundContainer)) stage.removeChild(backgroundContainer);
		if (stage.contains(introContainer)) stage.removeChild(introContainer);
		if (stage.contains(instructContainer)) stage.removeChild(instructContainer);
		if (stage.contains(creditsContainer)) stage.removeChild(creditsContainer);
		if (stage.contains(loseGameContainer)) stage.removeChild(loseGameContainer);
		if (stage.contains(winGameContainer)) stage.removeChild(winGameContainer);
		stage.update();
	}

	// ------------------------------------------------------ public methods
	this.progressMe = function(){
		// update progress bar
		progressBar.graphics.clear();
		progressBar.graphics.beginFill("#FFFFFF").drawRect(287,265,(290 * assetManager.getProgress()),3);
		stage.update();
	};

	this.highlightMe = function(which) {
		if (which == "Instructions") instructionsIcon.gotoAndStop("instructionsDown");
		else if (which == "Credits") creditsIcon.gotoAndStop("creditsDown");
		else if (which == "Start") startIcon.gotoAndStop("startDown");
	};

	this.nextPage = function(gamepadPresent){
		this.instructPage++;
        if (!gamepadPresent) instructClip.gotoAndStop("Instruct" + this.instructPage);
        else instructClip.gotoAndStop("gpInstruct" + this.instructPage);
	};

	this.showMe = function(which, gamepadPresent) {
		removeAllScreens();

		if (which == "Preload") {
			if (preloadContainer === undefined) initPreload();
			stage.addChild(preloadContainer);
		} else if (which == "Intro") {
			// construct background container if not already done
			if (backgroundContainer === undefined) initBackground();
			// first time showing intro - then construct it (cannot construct intro until all assets are loaded - hence why not in startMe)
			if (introContainer === undefined) initIntro();
			stage.addChild(backgroundContainer);
			stage.addChild(introContainer);
			// play intro music
			if (!introMusicPlayed) {
				if (loseGameMusic !== undefined) loseGameMusic.stop();
				if (winGameMusic !== undefined) winGameMusic.stop();
				createjs.Sound.play("IntroMusic");
				introMusicPlayed = true;
			}
		} else if (which == "Instruct") {
			if (instructContainer === undefined) initInstruct();
			this.instructPage = 0;
            
            console.log("test: " + gamepadPresent);
            
			this.nextPage(gamepadPresent);
			stage.addChild(backgroundContainer);
			stage.addChild(instructContainer);
		} else if (which == "Credits") {
			if (creditsContainer === undefined) initCredits();
			stage.addChild(backgroundContainer);
			stage.addChild(creditsContainer);
		} else if (which == "LoseGame") {
			if (loseGameContainer === undefined) initLoseGame();
			stage.addChild(loseGameContainer);
			introMusicPlayed = false;
			loseGameMusic = createjs.Sound.play("LoseGameMusic");
		} else if (which == "WinGame") {
			if (winGameContainer === undefined) initWinGame();
			stage.addChild(winGameContainer);
			introMusicPlayed = false;
			winGameMusic = createjs.Sound.play("WinGameMusic");
		}
		stage.update();
	};

	this.hideMe = function() {
		removeAllScreens();
	};
};
