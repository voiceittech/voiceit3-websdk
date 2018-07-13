const initializeBRF = require('./brf-js/libs/brf_wasm/BRFv4_JS_TK190218_v4.0.5_trial.js');
var brfv4 = null;
var brfManager = null;
var resolution = null;

const faceLib = {
  initializeBRF : initializeBRF,
  waitForSDK: function() {
    console.log("waiting for sdk");
    if(brfv4 === null) {
      brfv4 = { locateFile: function(fileName) { return 'brf-js/libs/brf_wasm/'+fileName; } };
      faceLib.initializeBRF(brfv4);
    }

    if(brfv4.sdkReady) {
        console.log("sdk is ready");
        faceLib.initSDK();
    } else {
      setTimeout(faceLib.waitForSDK, 100);
    }
  },
  initSDK:function(){
    resolution = new brfv4.Rectangle(0, 0, 100, 100);
    brfManager = new brfv4.BRFManager();
    console.log(resolution, brfManager);
  }
}

module.exports = faceLib;
