// Game asset manifest
var screenManifest = {src:"lib/Screens.png", id:"Screens", data:{
                        width:450, height:450, regPoint:"topLeft",
                        animations:{Preload:[0,0],Intro:[1,1],LoseGame:[2,2],WinGame:[3,3],
                                    Instruct1:[4,4],Instruct2:[5,5],Instruct3:[6,6],Credits:[7,7],
                                    gpInstruct1:[8,8],gpInstruct2:[9,9],gpInstruct3:[10,10]}
                    }};

var gameManifest = [{src:"lib/Plane.png", id:"Plane", data:{
                    width:40, height:40, regPoint:"center",
                    animations:{RedPlaneRight:[0,1],RedPlaneLeft:[2,3],
                                RedPlaneRightPassenger:[4,5],RedPlaneLeftPassenger:[6,7],
                                RedPlaneFlipRight:[8,15],RedPlaneFlipLeft:[16,23],
                                Explosion:[24,36],
                                BluePlaneRight:[37,38],BluePlaneLeft:[39,40],
                                BluePlaneFlipRight:[41,48],BluePlaneFlipLeft:[49,56],
                                RedPlaneRightBomb:[57,58],RedPlaneLeftBomb:[59,60],
                                RedPlaneRightPassengerBomb:[61,62],RedPlaneLeftPassengerBomb:[63,64],
                                BluePlaneLeftBomb:[65,66]}
                    }},
                    {src:"lib/bullet.png", id:"Bullet", data:{
                        width:7, height:9, regPoint:"center",
                        animations:{RedPlaneBullet:[0,0],RedTankBullet:[0,0],RedJeepBullet:[0,0],RedBunkerBullet:[0,0],
                                    BluePlaneBullet:[1,1],BlueTankBullet:[1,1],BlueJeepBullet:[1,1],BlueBunkerBullet:[1,1],
                                    Bomb:[2,10]}
                    }},
                    {src:"lib/Survivor.png", id:"Survivor", data:{
                        width:17, height:19, regPoint:"center",
                        animations:{walkLeft:[0,11],walkRight:[12,23],
                                    standing:[24,35],waving:[36,47],killed:[48,60]}
                    }},
                    {src:"lib/Balloon.png", id:"Balloon", data:{
                        width:49, height:99, regPoint:"center",
                        animations:{main:[0,0],killed:[1,20]}
                    }},
                    {src:"lib/Tank.png", id:"Tank", data:{
                        width:60, height:60, regPoint:"center",
                        animations:{BlueTankMoving:[0,8],BlueTankKill:[9,21],
                                    RedTankMoving:[22,30],RedTankKill:[9,21]}
                    }},
                    {src:"lib/Jeep.png", id:"Jeep", data:{
                        width:37, height:37, regPoint:"center",
                        animations:{BlueJeepMoving:[0,3],BlueJeepKill:[4,16],
                                    RedJeepMoving:[17,20],RedJeepKill:[4,16]}
                    }},
                    {src:"lib/Turret.png", id:"Turret", data:{
                        width:13, height:8, regPoint:"center",
                        animations:{main:[0,0]}
                    }},
                    {src:"lib/Clouds.png", id:"Clouds", data:{
                        width:185, height:63, regPoint:"topLeft",
                        animations:{cloud1:[0,0],cloud2:[1,1],cloud3:[2,2]}
                    }},
                    {src:"lib/Ground.png", id:"Ground", data:{
                        width:4800, height:17, regPoint:"topLeft",
                        animations:{main:[0,0]}
                    }},
                    {src:"lib/Hills.png", id:"Hills", data:{
                        width:4800, height:60, regPoint:"topLeft",
                        animations:{main:[0,0]}
                    }},
                    {src:"lib/Flags.png", id:"Flags", data:{
                        width:22, height:53, regPoint:"topLeft",
                        animations:{redFlag:[0,35],blueFlag:[36,71]}
                    }},
                    {src:"lib/misc.png", id:"Misc", data:{
                        width:40, height:43, regPoint:"topLeft",
                        animations:{RedBunker:[0,0],BlueBunker:[1,1],tower:[2,2]}
                    }},
                    {src:"lib/Factory.png", id:"Factory", data:{
                        width:132, height:83, regPoint:"topLeft",
                        animations:{RedFactory:[0,0],RedFactorySmoke:[1,30],
                        BlueFactory:[31,31],BlueFactorySmoke:[32,61],
                        RedFactoryKill:[62,83],RedFactorySmolder:[84,113],
                        BlueFactoryKill:[114,135],BlueFactorySmolder:[136,165]}
                    }},
                    {src:"lib/FactoryMenu.png", id:"FactoryMenu", data:{
                        width:108, height:39, regPoint:"topLeft",
                        animations:{header:[0,0],tankItem:[1,1],tankItemDown:[2,2],
                                    jeepItem:[3,3],jeepItemDown:[4,4],bombItem:[5,5],
                                    bombItemDown:[6,6]}
                    }},
                    {src:"lib/Prison.png", id:"Prison", data:{
                        width:63, height:42, regPoint:"topLeft",
                        animations:{main:[0,0],breakout:[1,13],broken:[13,13]}
                    }},
                    {src:"lib/Digits.png", id:"Digits", data:{
                        width:20, height:21, regPoint:"topLeft",
                        animations:{digit0:[0,0],digit1:[1,1],digit2:[2,2],
                                    digit3:[3,3],digit4:[4,4],digit5:[5,5],
                                    digit6:[6,6],digit7:[7,7],digit8:[8,8],
                                    digit9:[9,9],exclamation:[10,10],question:[11,11],
                                    slash:[12,12],balloon:[13,31],bomb:[32,50],
                                    plane:[51,69],stall:[51,69],survivor:[70,88]}
                    }},
                    {src:"lib/Icons.png", id:"Icons", data:{
                        width:31, height:28, regPoint:"topLeft",
                        animations:{lives:[0,0],saves:[1,1],deaths:[2,2],kills:[3,3],
                        instructions:[4,4],instructionsDown:[5,5],start:[6,6],startDown:[7,7],
                        credits:[8,8],creditsDown:[9,9]}
                    }},
                    {src:"lib/RedFire.mp3", id:"RedFire", data:4},
                    {src:"lib/BlueFire.mp3", id:"BlueFire", data:4},
                    {src:"lib/Explosion1.mp3", id:"Explosion1", data:4},
                    {src:"lib/Explosion2.mp3", id:"Explosion2", data:4},
                    {src:"lib/Explosion3.mp3", id:"Explosion3", data:4},
                    {src:"lib/FactoryExplosion.mp3", id:"FactoryExplosion", data:1},
                    {src:"lib/SurvivorPickup.mp3", id:"SurvivorPickup", data:1},
                    {src:"lib/SurvivorSaved.mp3", id:"SurvivorSaved", data:1},
                    {src:"lib/SurvivorBoarding.mp3", id:"SurvivorBoarding", data:1},
                    {src:"lib/SurvivorKilled.mp3", id:"SurvivorKilled", data:4},
                    {src:"lib/ExtraLife.mp3", id:"ExtraLife", data:1},
                    {src:"lib/Landing.mp3", id:"Landing", data:1},
                    {src:"lib/RedPlaneFlip.mp3", id:"RedPlaneFlip", data:1},
                    {src:"lib/RedPlaneClimbing.mp3", id:"RedPlaneClimbing", data:1},
                    {src:"lib/RedPlaneIdle.mp3", id:"RedPlaneIdle", data:1},
                    {src:"lib/RedPlaneTakeOff.mp3", id:"RedPlaneTakeOff", data:1},
                    {src:"lib/RedPlaneLanding.mp3", id:"RedPlaneLanding", data:1},
                    {src:"lib/RedPlaneStall.mp3", id:"RedPlaneStall", data:1},
                    {src:"lib/BluePlaneFlip.mp3", id:"BluePlaneFlip", data:1},
                    {src:"lib/BluePlaneClimbing.mp3", id:"BluePlaneClimbing", data:1},
                    {src:"lib/BluePlaneTakeOff.mp3", id:"BluePlaneTakeOff", data:1},
                    {src:"lib/BluePlaneStall.mp3", id:"BluePlaneStall", data:1},
                    {src:"lib/Alert.mp3", id:"Alert", data:1},
                    {src:"lib/StallWarning.mp3", id:"StallWarning", data:1},
                    {src:"lib/Bomb.mp3", id:"Bomb", data:1},
                    {src:"lib/Wind.mp3", id:"Wind", data:1},
                    {src:"lib/DeployVehicle.mp3", id:"DeployVehicle", data:4},
                    {src:"lib/IntroMusic.mp3", id:"IntroMusic", data:1},
                    {src:"lib/WinGameMusic.mp3", id:"WinGameMusic", data:1},
                    {src:"lib/LoseGameMusic.mp3", id:"LoseGameMusic", data:1}
                ];
