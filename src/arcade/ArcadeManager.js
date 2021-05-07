var ArcadeManager = function(){
    
    // public properties
    this.connected = false;
    // manifest for file for all gamepad buttons / joytsick
    var manifest = null;
    // self referencing pointer
    var me = this;
    // counter to stop searching for gamepad after certain amount of tries
    var counter = 0;
    // the gamepad object
    var gamepad = null;
    // array to keep track of buttons that have their button down - to prohibit clipping
    var buttonLock = [];
    var joyLock = [];
    // event objects for dispatching
    var keydownEvent = null;
    var keyupEvent = null;
 
    // --------------------------------------------- private methods
    function canGame() {
        return "getGamepads" in navigator;
    }
    
    // --------------------------------------------- event handlers
    function onGBConnected() {
        console.log(">> gamepad connected");
        
        // get reference to gamepad (only one on arcade machine)
        gamepad = navigator.getGamepads()[0];
        
        // initialization
        for(var i=0; i<gamepad.buttons.length; i++) buttonLock[i] = false;   
        for(i=0; i<manifest.joystick.length; i++) joyLock[i] = false;   
        keydownEvent = new Event("keydown");
        keyupEvent = new Event("keyup");
        
        me.connected = true;
    }
    
    function onGBDisconnected() {
        me.connected = false;
        console.log(">> gamepad disconnected");
    }
    
    // --------------------------------------------- public methods
    this.setup = function(myManifest){
        manifest = myManifest;
        counter = 0;
        if(canGame()) {
            // listen for gamepad connecting or disconnecting
            window.addEventListener("gamepadconnected", onGBConnected);
            window.addEventListener("gamepaddisconnected", onGBDisconnected);
 
            //setup an interval for Chrome
            var checkGP = window.setInterval(function() {
                //console.log(">> looking for gamepad");
                if(navigator.getGamepads()[0]) {
                    if(!this.active) onGBConnected();
                    window.clearInterval(checkGP);
                }
                counter++;
                if (counter >= 25) {
                    window.clearInterval(checkGP);
                    console.log(">> abandon gamepad connection");
                }
            }, 500);
            
        }
    };
    
    this.monitorMe = function(state){
        // does nothing if not connected
        if (!this.connected) return;
        
        // get reference to gamepad object
        var gamepad = navigator.getGamepads()[0];
        
        // loop through all buttons in gamepad manifest
        for (var n=0; n<manifest.buttons.length; n++) {
            var btnData = manifest.buttons[n];
            // check if game is in correct state for button to be active
            if (btnData.gameState === state) {
                // check if button is allowed to clip or not
                if ((!btnData.clipping) || (btnData.clipping === undefined)) {
                    // CLIPPING PROHIBITED ON BUTTON
                    if ((gamepad.buttons[btnData.id].pressed) && (!buttonLock[btnData.id])) {
                        if (btnData.keydown) {
                            keydownEvent.keyCode = btnData.keyCode;
                            document.dispatchEvent(keydownEvent); 
                        }
                        buttonLock[btnData.id] = true;
                    } else if ((!gamepad.buttons[btnData.id].pressed) && (buttonLock[btnData.id])) {
                        if (btnData.keyup) {
                            keyupEvent.keyCode = btnData.keyCode;
                            document.dispatchEvent(keyupEvent); 
                        }
                        buttonLock[btnData.id] = false;
                    }    
                } else {
                    // CLIPPING ALLOWED ON BUTTON
                    // check if button is pressed
                    if (gamepad.buttons[btnData.id].pressed) {
                        // if clipping is enabled then only keydown allowed
                        keydownEvent.keyCode = btnData.keyCode;
                        document.dispatchEvent(keydownEvent);                    
                    }
                }
            }
        }
        
        /*
        // exit game and go back to menu if START + SELECT pressed at the same time
        if ((gamepad.buttons[18].pressed) && (gamepad.buttons[19].pressed)) {
            window.location.href = "http://localhost/";
        }
        */
        
        // loop through all joystick axis in the gamepad manifest
        for (n=0; n<manifest.joystick.length; n++) {
            var axisData = manifest.joystick[n];
            // check if game is in correct state for button to be active
            if (axisData.gameState === state) {  
                if (!axisData.clipping) {
                    if (((gamepad.axes[axisData.axis] >= axisData.range[0]) && 
                        (gamepad.axes[axisData.axis] <= axisData.range[1])) && (!joyLock[n])) {
                        keydownEvent.keyCode = axisData.keyCode;
                        document.dispatchEvent(keydownEvent);
                        joyLock[n] = true;
                    } else if ((gamepad.axes[axisData.axis] < 0.1) && (gamepad.axes[axisData.axis] > -0.1) && (joyLock[n])) {
                        keyupEvent.keyCode = axisData.keyCode;
                        document.dispatchEvent(keyupEvent);
                        joyLock[n] = false;
                    }
                } else {
                    if ((gamepad.axes[axisData.axis] >= axisData.range[0]) && 
                        (gamepad.axes[axisData.axis] <= axisData.range[1])) {
                        keydownEvent.keyCode = axisData.keyCode;
                        document.dispatchEvent(keydownEvent);
                    } else {
                        keyupEvent.keyCode = axisData.keyCode;
                        document.dispatchEvent(keyupEvent);
                    }
                }
            }
        }
        
    };
    

};