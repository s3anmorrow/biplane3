// Bi-Plane! : War of the Aces
// Sean Morrow
// Feb 2013

// TODO blue jeep getting by redBunker

// game variables
var stage = null;
var canvas = null;
var downKey = false;
var upKey = false;
// array of all game objects currently in use
var usedList;
// lookup tables for trig functions
var sinTable, cosTable;
// game objects
var background, sky, gameScreen, scoreboard, redPlane, prison1, prison2, prison3, redFactory, blueFactory, redBunker, blueBunker, tower, balloon, landscape;
// object to preload and handle all assets (spritesheet and sounds)
var assetManager;
// object to setup and dispatch key events for gamepad events
var gamepadManager;
// object pool for all game objects
var objectPool;
// maximum number of planes allowed
var bluePlaneMax = -1;
var bluePlaneCount = 0;
// number of survivors currently in game
var survivorCount = -1;
// current level of difficult
var level = 0;
// state of the game
var state;

var GameConstants = {
	"FRAME_RATE":30,
	"STARTING_LIVES":5,
	"SURVIVORS_PER_PRISON":3,
	"SURVIVORS_REQ_FOR_BOMB":8,
	"KILLS_FOR_BALLOON":6,
	"RED_START_PRODUCTION_FREQ":15,
	"RED_PRODUCTION_PER_WORKER":1.5,
	"STATE_SETUP":-1,
	"STATE_INTRO":0,
	"STATE_INSTRUCT":1,
	"STATE_CREDITS":2,
	"STATE_PLAYING":3,
	"STATE_GAMEOVER":4
};

// max level is 8 : distance to drop blue plane / number of blue planes / delay between blue production (s) / blue production queue count / sky color
var levels = [
    {drop:2200,max:1,delay:0,total:0,color:"#6f9dcb"},
	{drop:1800,max:1,delay:60,total:1,color:"#6f9dcb"},
	{drop:1800,max:1,delay:60,total:3,color:"#79a2ca"},
	{drop:1600,max:2,delay:50,total:3,color:"#83a7ca"},
	{drop:1600,max:2,delay:50,total:4,color:"#8cabca"},
	{drop:1400,max:3,delay:50,total:4,color:"#96b0ca"},
	{drop:1400,max:3,delay:40,total:5,color:"#a0b5ca"},
	{drop:800,max:4,delay:40,total:6,color:"#aabaca"},
	{drop:800,max:4,delay:30,total:8,color:"#b3bfca"}
];

// ------------------------------------------------------------ private methods
function startGame() {
	// initialization
	level = 0;
	bluePlaneMax = 0;
	bluePlaneCount = 0;
	survivorCount = GameConstants.SURVIVORS_PER_PRISON * 3;

	// construct/start game objects (have to be in this order due to object dependencies)
	landscape.startMe();

	prison1 = objectPool.getPrison();
	prison1.startMe(1400);
	prison2 = objectPool.getPrison();
	prison2.startMe(2500);
	prison3 = objectPool.getPrison();
	prison3.startMe(3600);

	redBunker = objectPool.getBunker();
	redBunker.type = "RedBunker";
	redBunker.startMe(630);

	blueBunker = objectPool.getBunker();
	blueBunker.type = "BlueBunker";
	blueBunker.startMe(4485);

	tower = objectPool.getTower();
	tower.type = "Tower";
	tower.startMe(2006);

	balloon = objectPool.getBalloon();
	balloon.startMe(2015);

	redFactory = objectPool.getFactory();
	redFactory.type = "RedFactory";
	redFactory.startMe(14);

	blueFactory = objectPool.getFactory();
	blueFactory.type = "BlueFactory";
	blueFactory.startMe(4660);

	// everything is setup so now start redPlane
	redPlane.startMe();

	// add sky so it is above everything else
	stage.addChild(sky);

	// construct scoreboard (above everything else)
	scoreboard = new Scoreboard();
	scoreboard.startMe();

	// game event listener for all events that control gameplay
	stage.addEventListener("onGameEvent", onGameEvent);
	// change stage of game
	state = GameConstants.STATE_PLAYING;
    
    // start up level one
    levelMe();
}

function stopGame(win) {
	// kill game event listener
	stage.removeEventListener("onGameEvent", onGameEvent);
    //createjs.Ticker.removeEventListener("tick", onTick);
	// interface cleanup
	redPlane.removeMe();
	redFactory.hideMenu();
	landscape.resetMe();
	if (win) gameScreen.showMe("WinGame");
	else gameScreen.showMe("LoseGame");
	state = GameConstants.STATE_GAMEOVER;
}

function resetGame() {
	// scroll through all used elements and return them to the objectPool (with exceptions)
	var length = usedList.length;
	var object = null;
	for (var n=0; n<length; n++) {
		object = usedList[n];
		// remove everything except the clouds
		if ((object !== null) && (!(object instanceof Cloud))) object.removeMe();
	}
	scoreboard.removeMe();
	// show intro gameScreen
	background.graphics.beginFill("#6699CC").drawRect(0,0,800,500);
	background.cache(0,0,800,500);
	gameScreen.showMe("Intro");
	state = GameConstants.STATE_INTRO;
    //createjs.Ticker.addEventListener("tick", onTick);
}

function levelMe() {
	// have I maxed out the levels?
	if (level == levels.length) return;
	// levelling - every survivor saved the game increases a level
	level++;
	var levelData = levels[level - 1];
	// adjust all required objects to a new level of difficulty
	landscape.setDropDistance(levelData.drop);
	bluePlaneMax = levelData.max;
    // only start up factory if delay is greater than 0
    if (levelData.delay != 0) blueFactory.autoProduction(levelData.delay * GameConstants.FRAME_RATE, levelData.total);
	background.graphics.beginFill(levelData.color).drawRect(0,0,800,500);
	background.cache(0,0,800,500);

	console.log("level: " + level);
}

function balloonMe() {
	if ((balloon.state == BalloonState.LANDED) && (scoreboard.kills % GameConstants.KILLS_FOR_BALLOON === 0)) {
		balloon.release();
		redPlane.indicateMe(true,"balloon");
	}
}

function overtimeMe(){
	// has all the survivors been killed? - if so produce more if required for bomb (up the level by one)
	if ((scoreboard.saves < GameConstants.SURVIVORS_REQ_FOR_BOMB) && (survivorCount <= 0)){
        prison2.breakAgain();
    }
}

function randomMe(iLower,iUpper) {
	// randomly selects returns a number between range
	var iRandomNum = 0;
	iRandomNum = Math.round(Math.random() * (iUpper - iLower)) + iLower;
	return iRandomNum;
}

// ------------------------------------------------------------ event handlers
function onInit() {
	console.log(">> initializing");
	state = GameConstants.STATE_SETUP;

	// get reference to canvas
	canvas = document.getElementById("stage");
	// set canvas to as wide/high as the browser window
	canvas.width = 800;
	canvas.height = 500;
	// create stage object
	stage = new createjs.Stage(canvas);

	// color the background of the game with a shape
	background = new createjs.Shape();
	background.graphics.beginFill("#6699CC").drawRect(0,0,800,500);
	background.cache(0,0,800,500);
	stage.addChild(background);
	stage.update();

	// setup listener for when assetManager has loaded the gameScreen assets
	stage.addEventListener("onScreensLoaded", onPreloadAssets);
	// construct preloader object to load spritesheet and sound assets
	assetManager = new AssetManager();
	// load screens first so I can display the preload gameScreen
	assetManager.loadScreens(screenManifest);
}

function onPreloadAssets() {
	console.log(">> preloading assets");
	// kill eventlistener
	stage.removeEventListener("onScreensLoaded", onPreloadAssets);
	// construct gameScreen object
	gameScreen = new Screen();
	gameScreen.showMe("Preload");
	// setup listeners for when assetManager has loaded each asset and all assets
	stage.addEventListener("onAssetLoaded", gameScreen.progressMe);
	stage.addEventListener("onAssetsLoaded", onSetup);
	// load the rest of the assets (minus gameScreen assets)
	assetManager.loadAssets(gameManifest);
}

function onSetup() {
	console.log(">> setup");
	// kill event listeners
	stage.removeEventListener("onAssetLoaded", gameScreen.progressMe);
	stage.removeEventListener("onAssetsLoaded", onSetup);

	// now do the heavy work
	// setup lookup tables for trig in window object for global access
	sinTable = {};
	cosTable = {};
	var rads;
	var piOver180 = Math.PI/180;
	for (var n=0; n<=360; n++) {
		rads = n * piOver180;
		sinTable[n] = Math.sin(rads);
		cosTable[n] = Math.cos(rads);
	}

	// construct object pool
	objectPool = new ObjectPool();
	objectPool.init();
	// get reference to usedList from objectPool object
	usedList = objectPool.getUsedList();

	// setup listener for ticker to actually update the stage
	createjs.Ticker.useRAF = true;
	// set framerate
	createjs.Ticker.setFPS(GameConstants.FRAME_RATE);
	createjs.Ticker.addEventListener("tick", onTick);
    
    // construct gamepadManager
    gamepadManager =  new GamepadManager();
    gamepadManager.setup(gamepadManifest);

    // setup event listeners for keyboard keys
    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("keyup", onKeyUp);

	// game ready - show intro gameScreen
	gameScreen.showMe("Intro");

	// construct sky object for adding clouds to
	sky = new createjs.Container();
	stage.addChild(sky);

	// construct three clouds - but it requires the landscape object and that requires the redPlane (none are started)
	redPlane = objectPool.getPlane();
	redPlane.type = "RedPlane";
	landscape = objectPool.getLandscape();
	var cloud;
	cloud = objectPool.getCloud();
	cloud.startMe(125);
	cloud = objectPool.getCloud();
	cloud.startMe(425);
	cloud = objectPool.getCloud();
	cloud.startMe(620);

	// change state of game
	state = GameConstants.STATE_INTRO;
	console.log(">> intro gameScreen ready");
}

function onKeyDown(e) {
	if (state == GameConstants.STATE_INTRO) {
		if (e.key == "s") gameScreen.highlightMe("Start",true);
		else if (e.key == "c") gameScreen.highlightMe("Credits",true);
		else if (e.key == "i") gameScreen.highlightMe("Instructions",true);
	} else if (state == GameConstants.STATE_PLAYING) {
		if (e.key == "ArrowDown") downKey = true;
		else if (e.key == "ArrowUp") upKey = true;
		else if (e.key == " ") redPlane.spaceMe();
		else if ((e.key == "b") && (redPlane.state != PlaneState.LANDED)) redPlane.bombMe();
        else if ((e.key == "b") && (redFactory.menuShowing)) redFactory.highlightMe("RedBomb");
        else if ((e.key == "ArrowLeft") || (e.key == "ArrowRight") && (redPlane.state != PlaneState.LANDED)) redPlane.flipMe();
        else if ((e.key == "ArrowLeft") || (e.key == "ArrowRight") && (redFactory.menuShowing)) redFactory.highlightMe("RedJeep");
		else if (e.key == "1") redFactory.highlightMe("RedTank");
		else if (e.key == "2") redFactory.highlightMe("RedJeep");
		else if (e.key == "3") redFactory.highlightMe("RedBomb");
	}
	// prevent down from scrolling the window in browser
	e.preventDefault();
}

function onKeyUp(e) {
	if (state == GameConstants.STATE_INTRO) {
		if (e.key == "s") {
			gameScreen.hideMe();
			startGame();
		} else if (e.key == "c") {
			state = GameConstants.STATE_CREDITS;
			gameScreen.showMe("Credits");
		} else if (e.key == "i") {
			state = GameConstants.STATE_INSTRUCT;
			gameScreen.showMe("Instruct",gamepadManager.connected);
		}
	} else if (state == GameConstants.STATE_INSTRUCT) {
		if (gameScreen.instructPage == 3) {
			state = GameConstants.STATE_INTRO;
			gameScreen.showMe("Intro");
		} else {
			gameScreen.nextPage(gamepadManager.connected);
		}
	} else if (state == GameConstants.STATE_CREDITS) {
		state = GameConstants.STATE_INTRO;
		gameScreen.showMe("Intro");
	} else if (state == GameConstants.STATE_PLAYING) {
		if (e.key == "ArrowDown") downKey = false;
		else if (e.key == "ArrowUp") upKey = false;
		else if (e.key == "1") redFactory.produce("RedTank");
		else if (e.key == "2") redFactory.produce("RedJeep");
		else if (e.key == "3") redFactory.produce("RedBomb");
        else if ((e.key == "b") && (redFactory.menuShowing)) redFactory.produce("RedBomb");
        else if ((e.key == "ArrowLeft") || (e.key == "ArrowRight") && (redFactory.menuShowing)) redFactory.produce("RedJeep");
	} else if (state == GameConstants.STATE_GAMEOVER) {
		if (e.key == " ") resetGame();
	}
	e.preventDefault();
}

function onGameEvent(e) {
	console.log("gameEvent: " + e.id);

    // reused variables
    var pilot, survivor, n;
	// what type of event has occurred?
	switch (e.id){
		case "planeKilled":
			var type = e.source.type;
			if (type == "RedPlane") {
				scoreboard.adjustLives(-1);
				landscape.rewindMe();
			} else if (type == "BluePlane") {
				bluePlaneCount--;
				scoreboard.adjustKills(1);
				balloonMe();
			}
			break;
		case "tankKilled":
			if (e.source.type == "BlueTank") {
				scoreboard.adjustKills(1);
				balloonMe();
			}
			break;
		case "jeepKilled":
			if (e.source.type == "BlueJeep") {
				scoreboard.adjustKills(1);
				balloonMe();
			}
			break;
		case "survivorKilled":
			scoreboard.adjustDeaths(1);
			survivorCount--;
			overtimeMe();
			break;
		case "balloonKilled":
			balloon.resetMe();
			break;
		case "freeLife":
			scoreboard.adjustLives(1);
			createjs.Sound.play("ExtraLife");
			break;
		case "planeLanded":
			// show factory production menu
			// determine start and end of runway with displacement taken into consideration
			var runwayStartX = redFactory.clip.x + 150;
			var runwayEndX = redFactory.clip.x + 610;
			// only if plane landed on runway
			if ((redPlane.clip.x > runwayStartX) && (redPlane.clip.x < runwayEndX)) {
				redFactory.showMenu();
				// drop off survivor
				if (redPlane.survivor !== null) redPlane.survivor.unBoardMe();
				// flip around plane if not enough room to take off again
				if (((runwayEndX - redPlane.clip.x) < 160) && (redPlane.facing == 1)) redPlane.setFacing(-1);
				else if (((redPlane.clip.x - runwayStartX) < 160) && (redPlane.facing == -1)) redPlane.setFacing(1);
			} else if (redPlane.survivor === null) {
				// picking up
				var survivorPool = objectPool.survivorPool;
				var length = survivorPool.length;
				var luckySurvivor = null;
				var dif;
				for (n=0; n<length; n++) {
					survivor = survivorPool[n];
					if ((survivor.used) && (survivor.state == SurvivorState.WANDERING)) {
						// find first survivor on stage at the moment
						dif = survivor.clip.x - redPlane.clip.x;
						if ((dif > -300) && (dif < 300)) {
							luckySurvivor = survivor;
							break;
						}
					}
				}
				// survivor gets to board
				if (luckySurvivor !== null) luckySurvivor.boardMe();
			}
			break;
		case "planeTakeOff":
			redFactory.hideMenu();

            //onGameEvent({id:"survivorSaved"});

			break;
		case "survivorSaved":
			scoreboard.adjustSaves(1);
			survivorCount--;
			redFactory.adjustWorkers(1);
			levelMe();
			// can I produce a bomb now?
			if (scoreboard.saves >= GameConstants.SURVIVORS_REQ_FOR_BOMB) {
				redFactory.enableBombs();
				redPlane.indicateMe(true,"bomb");
			}
			createjs.Sound.play("SurvivorSaved");
			overtimeMe();
			break;
		case "landscapeReset":
			// check for game over
			if (scoreboard.lives === 0) {
				// game over - play ending sequence (bombing redBase)
				pilot = objectPool.getPilot();
				pilot.type = "WinPilot";
				bluePlane = objectPool.getPlane();
				bluePlane.type = "BluePlane";
				// give bluePlane to pilot for full control
				pilot.startMe(bluePlane);
			} else {
				redFactory.showMenu();
				redPlane.resetMe();
			}
			break;
		case "dropDistance":
			// no dropping blue planes near the base
			if ((landscape.ground.x < -1000) && (bluePlaneCount < bluePlaneMax)) {
				// get pilot and blueplane
				pilot = objectPool.getPilot();
				pilot.type = "GamePilot";
				bluePlane = objectPool.getPlane();
				bluePlane.type = "BluePlane";
                
                // blue biplanes easier for first four levels
                if (level < 4) {
                    bluePlane.cruiseSpeed = 5
                    bluePlane.rotateIncrement = 4;
                } 
                
				// give bluePlane to pilot for full control
				pilot.startMe(bluePlane);
				bluePlaneCount++;
				redPlane.indicateMe(true,"plane");
			}
			break;
		case "prisonBroken":
			// disperse survivors
			var startX = e.source.clip.x + 18;
			var survivorTotal = GameConstants.SURVIVORS_PER_PRISON;
			for (n=0; n<survivorTotal; n++) {
				survivor = objectPool.getSurvivor();
				survivor.startMe(startX + randomMe(-2,2));
			}
			break;
		case "prisonBrokenAgain":
			// prison broken again (overtime)
			survivorCount = GameConstants.SURVIVORS_PER_PRISON;
			levelMe();
			redPlane.indicateMe(true,"survivor");
			break;
		case "factoryKilled":
			if (e.source.type == "BlueFactory") stopGame(true);
			else stopGame(false);
			break;
	}
}

// game loop method
function onTick() {

	// !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!! TESTING
	//document.getElementById("fps").innerHTML = createjs.Ticker.getMeasuredFPS();
	// !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!

	// STEP I : KEYBOARD / GAMEPAD MONITORING
	if (upKey) redPlane.rotateUp();
	else if (downKey) redPlane.rotateDown();
    // monitor gamepadManager for any buttons / joystick changes
    gamepadManager.monitorMe(state);

	// STEP II : UPDATING STEP
	// scroll through all used objects in game and update them all
	var length = usedList.length;
	var target = null;
	for (var n=0; n<length; n++) {
		target = usedList[n];
		if (target !== null) target.updateMe();
	}

	// STEP III : RENDERING
	// update the stage!
	stage.update();
}
