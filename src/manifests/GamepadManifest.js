var gamepadManifest = {
    buttons:[
        {
            // fire button / take off if landed
            id:0,
            key:" ", //32
            keyup:false,
            keydown:true,
            clipping:false,
            gameState:3
        },
        {
            // flip plane button / release jeep (if landed at base)
            id:2,
            key:"ArrowLeft", //37
            keyup:true,
            keydown:true,
            clipping:false,
            gameState:3
        },
        {
            // bomb button / load bomb button (if landed)
            id:2,
            key:"b", //66
            keyup:true,
            keydown:true,
            clipping:false,
            gameState:3
        },
        {
            // release tank
            id:1,
            key:"1", //49
            keyup:true,
            keydown:true,
            clipping:false,
            gameState:3
        },
        {
            // view instructions
            id:8,
            key:"i", // 73
            keyup:true,
            keydown:true,
            clipping:false,
            gameState:0
        },
        {
            // next page in instructions
            id:8,
            key:"i", //73
            keyup:true,
            keydown:false,
            clipping:false,
            gameState:1
        },
        {
            // start game button to start game
            id:9,
            key:"s", // 83
            keyup:true,
            keydown:true,
            clipping:false,
            gameState:0
        },
        {
            // fire game button to start game
            id:0,
            key:"s", //83
            keyup:true,
            keydown:true,
            clipping:false,
            gameState:0
        },
        {
            // view credits
            id:1,
            key:"c", //67
            keyup:true,
            keydown:true,
            clipping:false,
            gameState:0
        },
        {
            // close credits
            id:1,
            key:"c", //67
            keyup:true,
            keydown:false,
            clipping:false,
            gameState:2
        },
        {
            // fire button to play again when game is over
            id:0,
            key:" ", //32
            keyup:true,
            keydown:true,
            clipping:false,
            gameState:4
        }
    ],
    joystick:[
        {
            key:"ArrowDown", //40
            enter:true,
            exit:true,
            axis:1,
            range:[0.7,1.0],
            gameState:3
        },
        {
            key:"ArrowUp", //38
            enter:true,
            exit:true,
            axis:1,
            range:[-1.0,-0.7],
            gameState:3
        }
    ]
};