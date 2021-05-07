/*
Porting HTML5 Games over to the Arcade Machine
----------------------------------------------
Construct ArcadeManager and call monitorMe(state) on every tick (see notes below on state)

The following are the buttons id's to be used below in the manifest.
A = 10
B = 12
C = 11
D = 13
START = 18
SELECT = 19

Buttons invoke a keypress event which are picked up by standard listeners.
Typical entry in manifest:
{
    // start button to start game
    id:[id of button],
    keyCode:[keycode to invoke - match this up with your keyboard controls of your game],
    keydown:[false unless clipping:true],
    keyup:[true - typically use this one],
    clipping:[true|false],
    gameState:[state as integer (see note below)]
}
keydown does nothing unless clipping:true. Use keyup typically.
gameState is an integer that is few into the ArcadeManager's monitorMe(state) method called on every tick. This can be defaulted to 0 or set. Basically exists so that the same button can do different things at different times in the game (i.e. the fire button starts the game AND fires the gun in the game)

Notes:
Machine will automatically boot var/www/html/index.htm (menu system)
Games are copied into var/www/html/games/[game folder name]/
All games must have their entry HTML file named index.html
ArcadeManager is wired up to go back to the main menu app (ArcadeMachineMenu) when START + SELECT are pressed
*/

var arcadeManifest = {
    buttons:[
        {
            // fire button / release jeep button
            id:10,
            keyCode:32,
            keyup:false,
            keydown:true,
            clipping:false,
            gameState:3
        },
        {
            // flip plane button
	        id:12,            
            keyCode:37,
            keyup:true,
            keydown:true,
            clipping:false,
            gameState:3
        },
        {
            // bomb button / load bomb button (if landed)
            id:12,
            keyCode:66,
            keyup:true,
            keydown:true,
            clipping:false,
            gameState:3
        },
        {
            // release tank
            id:13,
            keyCode:49,
            keyup:true,
            keydown:true,
            clipping:false,
            gameState:3
        },
        {
            // view instructions
            id:19,
            keyCode:73,
            keyup:true,
            keydown:true,
            clipping:false,
            gameState:0
        },
        {
            // next page in instructions
            id:19,
            keyCode:73,
            keyup:true,
            keydown:false,
            clipping:false,
            gameState:1
        },
        {
            // start game button to start game
            id:10,
            keyCode:83,
            keyup:true,
            keydown:true,
            clipping:false,
            gameState:0
        },
        {
            // start button to start game
            id:18,
            keyCode:83,
            keyup:true,
            keydown:true,
            clipping:false,
            gameState:0
        },
        {
            // view credits
            id:11,
            keyCode:67,
            keyup:true,
            keydown:true,
            clipping:false,
            gameState:0
        },
        {
            // close credits
            id:11,
            keyCode:67,
            keyup:true,
            keydown:false,
            clipping:false,
            gameState:2
        },
        {
            // fire button to play again when game is over
            id:18,
            keyCode:32,
            keyup:true,
            keydown:true,
            clipping:false,
            gameState:4
        }
    ],
    joystick:[
        {
            keyCode:40,
            enter:true,
            exit:true,
            axis:1,
            range:[0.7,1.0],
            gameState:3
        },
        {
            keyCode:38,
            enter:true,
            exit:true,
            axis:1,
            range:[-1.0,-0.7],
            gameState:3
        }
    ]
};