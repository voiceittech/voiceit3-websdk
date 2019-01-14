import vi$ from './utilities';
import Prompts from './prompts';
import initFaceTracker  from './facetracker';
import LivenessMath from './livenessMath';
const LIVENESS_TEST_TIMEOUT = 3500;
import Colors from './colors';

export default function Liveness(VoiceItObj, face_detector_path, modal, currentPhrase) {
  const LivenessRef = this;
  const _isWebAssemblySupported = vi$.isWebAssemblySupported();
  LivenessRef.animationId = 0;
  LivenessRef.manyfaces = false;
  LivenessRef.livenessStarted = false;

  // Refactor prompts to be prop on modal object
  LivenessRef.prompts = new Prompts();
  LivenessRef.cancel = false;
  LivenessRef.oldCircles = [];
  LivenessRef.setup = false;
  LivenessRef.imageDataCtx = modal.domRef.imageCanvas.getContext('2d');
  LivenessRef.faceTrackerLib = null;
  LivenessRef.faceManager = undefined;
  LivenessRef.resolution = null;
  LivenessRef.test;
  LivenessRef.cancel = false;

  LivenessRef.setupVariables = function(testType){
    LivenessRef.tests = vi$.shuffle( [1, 2, 3]);// 4 Yawn Test Disabled
    LivenessRef.testTimeStart = Date.now();
    LivenessRef.currentTest = LivenessRef.tests[0];
    LivenessRef.testIndex = 0;
    LivenessRef.doingLiveness = true;
    LivenessRef.passed = {
      test: -1,
      value: false
    };
    LivenessRef.oldTest = -1;
    LivenessRef.passedTests = 0;
    LivenessRef.oldVertices = [];
    // TODO: Make this dynamic
    LivenessRef.numTests = 2;
    LivenessRef.type = testType;
    LivenessRef.livenessTries = 0;
    // TODO: Make this dynamic
    LivenessRef.MAX_TRIES = 1;
    LivenessRef.doingLiveness = false;
    LivenessRef.checkForFaceStraight = false;
    LivenessRef.verificationTries = 0;
    LivenessRef.successPics = [];
    LivenessRef.timePassed = 0;
    LivenessRef.passedAll = false;
    // Liveness counters
    LivenessRef.turnedRightCounter = 0;
    LivenessRef.turnedLeftCounter = 0;
    LivenessRef.yawnCounter = 0;
    LivenessRef.smileCounter = 0;
    LivenessRef.facedDownCounter = 0;
    LivenessRef.faceOtherWayCounter = 0;
  }

  // Reset test counters
  LivenessRef.resetLivenessCounters = function() {
    LivenessRef.turnedRightCounter = 0;
    LivenessRef.turnedLeftCounter = 0;
    LivenessRef.yawnCounter = 0;
    LivenessRef.smileCounter = 0;
    LivenessRef.facedDownCounter = 0;
    LivenessRef.faceOtherWayCounter = 0;
  }

  LivenessRef.loadFaceTracker = function(faceTrackerStarted) {
    vi$.readWASMBinary(face_detector_path, function(wasmBuffer){
      LivenessRef.faceTrackerLib = {
          wasmBinary: wasmBuffer
         };
        initFaceTracker(LivenessRef.faceTrackerLib, function(){
          LivenessRef.resolution = new LivenessRef.faceTrackerLib.Rectangle(0, 0, modal.domRef.imageCanvas.width, modal.domRef.imageCanvas.height);
          LivenessRef.faceManager = new LivenessRef.faceTrackerLib.FaceTrackerManager();
          LivenessRef.faceManager.init(LivenessRef.resolution, LivenessRef.resolution, "VoiceItFaceTracking");
          faceTrackerStarted();
      });
    });
  };

  LivenessRef.snapLivenessPic = function(){
    VoiceItObj.snapPic();
    // modal.domRef.imageCanvas.toBlob(function(imageBlob){
    //   LivenessRef.successPics.push(imageBlob);
    // });
  };

  // Why is this never called?
  function tooManyFaces() {
    vi$.fadeIn(modal.domRef.outerOverlay, 200);
    // TODO: refactor this to use prompts.js
    modal.displayMessage("Please make sure there is only one face in the camera view");
  }

  function singleface() {
    vi$.fadeIn(modal.domRef.outerOverlay, 200);
  }

  LivenessRef.startLiveness = function(testType){
    if(LivenessRef.livenessStarted){ return; }
    LivenessRef.setupVariables();
    LivenessRef.livenessStarted = true;
    LivenessRef.type = testType;
    modal.createLivenessCircle();
    LivenessRef.drawCircle(LivenessRef.currentTest);
    LivenessRef.trackfaces();
  };

  LivenessRef.tryAgain = function(turnBack){
      modal.hideProgressCircle(300);
      vi$.fadeIn(modal.domRef.outerOverlay, 300);
      modal.displayMessage(LivenessRef.prompts.getPrompt(turnBack ? "LIVENESS_TRY_AGAIN_AND_TURN_BACK" : "LIVENESS_TRY_AGAIN"));
  };

  LivenessRef.passedLivenessTest = function(){
    LivenessRef.cancel = true;
    // Show waiting, post liveness success
    modal.updateProgressCircle(modal.domRef.progressCircle, LivenessRef.oldCircles[0], Colors.MAIN_THEME_COLOR);
    vi$.qs(modal.domRef.progressCircle).style.transform = LivenessRef.oldCircles[1];
  };

  LivenessRef.passedAllFaceLivenessTests = function(){
    modal.updateProgressCircle(modal.domRef.progressCircle, LivenessRef.oldCircles[0], Colors.MAIN_THEME_COLOR);
    vi$.qs(modal.domRef.progressCircle).style.transform = LivenessRef.oldCircles[1];
    setTimeout(function() {
      modal.hideProgressCircle(300, function() {
        modal.domRef.progressCircle.style.display = 'none';
      });
    }, 300);
    vi$.fadeIn(modal.domRef.outerOverlay,300);
    LivenessRef.cancel = true;
    VoiceItObj.onFinishLivenessFaceVerification();
  }


  LivenessRef.passedAllVideoLivenessTests = function(){
    LivenessRef.cancel = true;
    // Show waiting, ready to start video verification post liveness success
    modal.updateProgressCircle(modal.domRef.progressCircle, LivenessRef.oldCircles[0], Colors.MAIN_THEME_COLOR);
    vi$.qs(modal.domRef.progressCircle).style.transform = LivenessRef.oldCircles[1];
    modal.hideProgressCircle(500, function() {
        modal.domRef.progressCircle.style.display = 'none';
    });
  }

  LivenessRef.failedLiveness = function() {
    // Failed liveness
    vi$.fadeOut(modal.domRef.progressCircle, 300, function(){
        modal.domRef.progressCircle.style.display = 'none';
    });

    vi$.fadeIn(modal.domRef.outerOverlay, 300);
    modal.displayMessage(LivenessRef.prompts.getPrompt("LIVENESS_FAILED"));
    VoiceItObj.exitOut();
  }

  LivenessRef.trackfaces = function() {
    if (!LivenessRef.cancel){
      const imageArray = LivenessRef.imageDataCtx.getImageData(0, 0, LivenessRef.resolution.width, LivenessRef.resolution.height).data;
      LivenessRef.faceManager.update(imageArray);
      var faces = LivenessRef.faceManager.getFaces();
      // TODO: If more than one face, say please
      // make sure only once face is in camera
      var face = faces[0];
      LivenessRef.livenessCheck(face, function(){
        // Failed Callback
      });
      LivenessRef.animationId = window.requestAnimationFrame(LivenessRef.trackfaces);
    }
  }

  LivenessRef.livenessRetest = function(previousTest){
    LivenessRef.redrawCircle(previousTest);
    vi$.fadeIn(modal.domRef.outerOverlay, 600, null, 0.3);
  }

  LivenessRef.livenessCheck = function(faceObject, failedCallback) {
    const timeDiff = Date.now() - LivenessRef.testTimeStart;
    const testTimedOut = timeDiff > LIVENESS_TEST_TIMEOUT;
    // If Test timed out retry
    if (testTimedOut) {
      LivenessRef.livenessTries++;
      // If Failed More Liveness test than tries then fail
      if (LivenessRef.livenessTries > LivenessRef.MAX_TRIES) {
        failedCallback();
      }
      // Otherwise retry liveness tests
      else {
        LivenessRef.doingLiveness = false;
        LivenessRef.tryAgain();
        LivenessRef.testIndex++;
        if (LivenessRef.testIndex > (LivenessRef.tests.length - 1)) {
          LivenessRef.testIndex = 0;
        }
        LivenessRef.currentTest = LivenessRef.tests[LivenessRef.testIndex];
        setTimeout(function() {
          LivenessRef.livenessRetest(LivenessRef.currentTest);
          LivenessRef.testTimeStart = Date.now();
          setTimeout(() => {
            LivenessRef.doingLiveness = true;
          }, 300);
        }, 2000);
      }
    }

    // While liveness tests not passed keep processing faceObjects
    if (LivenessRef.passedTests < LivenessRef.numTests) {
      LivenessMath.processFaceObject(LivenessRef, faceObject, function(){
        VoiceItObj.StopRecording(0);
        LivenessRef.failedLiveness();
        LivenessRef.doingLiveness = false;
      });
    }

    // If Liveness Test Passed
    if (LivenessRef.passed.value) {
      LivenessRef.snapLivenessPic();
      LivenessRef.passedTests++;
      LivenessRef.testIndex++;
      if (LivenessRef.testIndex > 3) {
        // If testIndex greater than 3 than reset tests to start from beginning
        LivenessRef.testIndex = 0;
      }

      LivenessRef.oldTest = LivenessRef.currentTest;
      LivenessRef.currentTest = LivenessRef.tests[LivenessRef.testIndex];
      if (LivenessRef.passedTests < LivenessRef.numTests) {
        if (LivenessRef.cancel){
          LivenessRef.cancel = false;
        }
        LivenessRef.redrawCircle(LivenessRef.currentTest);
        if (LivenessRef.oldTest < 3) {
          LivenessRef.timePassed = Date.now();
          LivenessRef.checkForFaceStraight = true;
        } else if (LivenessRef.oldTest >= 3) {
          LivenessRef.checkForFaceStraight = false;
          LivenessRef.snapLivenessPic();
        }
        LivenessRef.resetLivenessCounters();
      } else {
        LivenessRef.passedAll = true;
        if (LivenessRef.type === "face") {
          LivenessRef.passedAllFaceLivenessTests();
        } else {
          LivenessRef.passedAllVideoLivenessTests();
        }

        var recordingTimeout = 500;
        if (LivenessRef.oldTest < 3) {
          LivenessRef.snapLivenessPic();
          LivenessRef.passedLivenessTest();
          recordingTimeout = 800;
        } else if (LivenessRef.oldTest >= 3) {
          LivenessRef.snapLivenessPic();
        }

        setTimeout(() => {
          // TODO: Refactor Stop Recording
          VoiceItObj.StopRecording(1);
          if (LivenessRef.type === "video") {
              VoiceItObj.continueToVoiceVerification();
          }
        }, recordingTimeout);

        LivenessRef.doingLiveness = false;
      }
      LivenessRef.passed.value = false;

      if (LivenessRef.checkForFaceStraight) {
        const timeNow = Date.now();
        if ((faceObject.rotationY < 0.2 && faceObject.rotationY > -0.2 && faceObject.rotationX < 0.20) || (timeNow - LivenessRef.timePassed > 1000)) {
          LivenessRef.testTimeStart = timeNow;
          LivenessRef.successPics = [];
          LivenessRef.snapLivenessPic();
          LivenessRef.resetLivenessCounters();
          LivenessRef.checkForFaceStraight = false;
        }
      }

    }

  }

  LivenessRef.resume = function() {
    LivenessRef.stop = false;
    LivenessRef.setup = true;
    LivenessRef.cancel = false;
    LivenessRef.trackfaces();
  }

  LivenessRef.drawCircle = function(testType) {
    switch (testType) {
      case 0:
        modal.displayMessage(LivenessRef.prompts.getPrompt('FACE_DOWN'));
        modal.updateProgressCircle(modal.domRef.progressCircle, 0.25, '#FFFFFF');
        vi$.qs(modal.domRef.progressCircle).style.transform = 'rotate(0deg)';
        LivenessRef.oldCircles[0] = 0.25;
        LivenessRef.oldCircles[1] = 'rotate(0deg)';
        break;
      case 1:
        modal.displayMessage(LivenessRef.prompts.getPrompt('FACE_RIGHT'));
        modal.updateProgressCircle(modal.domRef.progressCircle, 0.25, '#FFFFFF');
        vi$.qs(modal.domRef.progressCircle).style.transform = 'rotate(45deg)';
        LivenessRef.oldCircles[0] = 0.25;
        LivenessRef.oldCircles[1] = 'rotate(45deg)';
        break;
      case 2:
        modal.displayMessage(LivenessRef.prompts.getPrompt('FACE_LEFT'));
        modal.updateProgressCircle(modal.domRef.progressCircle, 0.25, '#FFFFFF');
        vi$.qs(modal.domRef.progressCircle).style.transform = 'rotate(220deg)';
        LivenessRef.oldCircles[0] = 0.25;
        LivenessRef.oldCircles[1] = 'rotate(220deg)';
        break;
      case 3:
        modal.displayMessage(LivenessRef.prompts.getPrompt('SMILE'));
        modal.updateProgressCircle(modal.domRef.progressCircle, 1.0, '#FFFFFF');
        vi$.qs(modal.domRef.progressCircle).style.transform = 'rotate(0deg)';
        LivenessRef.oldCircles[0] = 1.0;
        LivenessRef.oldCircles[1] = 'rotate(0deg)';
        break;
      case 4:
        modal.displayMessage(LivenessRef.prompts.getPrompt('YAWN'));
        modal.updateProgressCircle(modal.domRef.progressCircle, 1.0, '#FFFFFF');
        vi$.qs(modal.domRef.progressCircle).style.transform = 'rotate(0deg)';
        LivenessRef.oldCircles[0] = 1.0;
        LivenessRef.oldCircles[1] = 'rotate(0deg)';
        break;
      default:
    }
  }

  LivenessRef.redrawCircle = function(testType) {
    switch (testType) {
      case 0:
        modal.updateProgressCircle(modal.domRef.progressCircle, LivenessRef.oldCircles[0], Colors.MAIN_THEME_COLOR);
        vi$.qs(modal.domRef.progressCircle).style.transform = LivenessRef.oldCircles[1];
        setTimeout(function() {
          modal.displayMessage(LivenessRef.prompts.getPrompt('FACE_DOWN'));
          modal.hideProgressCircle(300, function() {
            modal.updateProgressCircle(modal.domRef.progressCircle, 0.25, '#FFFFFF');
            vi$.qs(modal.domRef.progressCircle).style.transform = 'rotate(0deg)';
            LivenessRef.oldCircles[0] = 0.25;
            LivenessRef.oldCircles[1] = 'rotate(0deg)';
            modal.revealProgressCircle(300);
          });
        }, 300);
        break;
      case 1:
        modal.updateProgressCircle(modal.domRef.progressCircle, LivenessRef.oldCircles[0], Colors.MAIN_THEME_COLOR);
        vi$.qs(modal.domRef.progressCircle).style.transform = LivenessRef.oldCircles[1];
        setTimeout(function() {
          modal.displayMessage(LivenessRef.prompts.getPrompt('FACE_RIGHT'));
          modal.hideProgressCircle(300, function() {
            modal.updateProgressCircle(modal.domRef.progressCircle, 0.25, '#FFFFFF');
            vi$.qs(modal.domRef.progressCircle).style.transform = 'rotate(45deg)';
            LivenessRef.oldCircles[0] = 0.25;
            LivenessRef.oldCircles[1] = 'rotate(45deg)';
            modal.revealProgressCircle(300);
          });
        }, 300);
        break;
      case 2:
        modal.updateProgressCircle(modal.domRef.progressCircle, LivenessRef.oldCircles[0], Colors.MAIN_THEME_COLOR);
        vi$.qs(modal.domRef.progressCircle).style.transform = LivenessRef.oldCircles[1];
        setTimeout(function() {
          modal.displayMessage(LivenessRef.prompts.getPrompt('FACE_LEFT'));
          modal.hideProgressCircle(300, function() {
            modal.updateProgressCircle(modal.domRef.progressCircle, 0.25, '#FFFFFF');
            vi$.qs(modal.domRef.progressCircle).style.transform = 'rotate(220deg)';
            LivenessRef.oldCircles[0] = 0.25;
            LivenessRef.oldCircles[1] = 'rotate(220deg)';
            modal.revealProgressCircle(300);
          });
        }, 300);
        break;
      case 3:
        modal.updateProgressCircle(modal.domRef.progressCircle, LivenessRef.oldCircles[0], Colors.MAIN_THEME_COLOR);
        vi$.qs(modal.domRef.progressCircle).style.transform = LivenessRef.oldCircles[1];
        setTimeout(function() {
          modal.displayMessage(LivenessRef.prompts.getPrompt('SMILE'));
          modal.hideProgressCircle(300, function() {
            modal.updateProgressCircle(modal.domRef.progressCircle, 1.0, '#FFFFFF');
            LivenessRef.oldCircles[0] = 1.0;
            LivenessRef.oldCircles[1] = 'rotate(0deg)';
            modal.revealProgressCircle(300);
          });
        }, 300);
        break;
      case 4:
        modal.updateProgressCircle(modal.domRef.progressCircle, LivenessRef.oldCircles[0], Colors.MAIN_THEME_COLOR);
        vi$.qs(modal.domRef.progressCircle).style.transform = LivenessRef.oldCircles[1];
        setTimeout(function() {
          modal.displayMessage(LivenessRef.prompts.getPrompt('YAWN'));
          modal.hideProgressCircle(300, function() {
            modal.updateProgressCircle(modal.domRef.progressCircle, 1.0, '#FFFFFF');
            LivenessRef.oldCircles[0] = 1.0;
            LivenessRef.oldCircles[1] = 'rotate(0deg)';
            modal.revealProgressCircle(300);
          });
        }, 300);
        break;
      default:
    }
  }

  // TODO: Revisit to make sure everything is necessary and cleared appropriately
  LivenessRef.destroy = function ()  {
    LivenessRef.cancel = true;
    window.cancelAnimationFrame(LivenessRef.animationId);
    delete 	LivenessRef.oldCircle;
    modal.domRef.imageCanvas = null;
    delete modal.domRef.imageCanvas;
    LivenessRef.imageDataCtx = null;
    delete LivenessRef.imageDataCtx;
    for (var key in LivenessRef.faceTrackerLib ){
      LivenessRef.faceTrackerLib[key] = null;
      delete LivenessRef.faceTrackerLib[key];
    }
    LivenessRef.faceTrackerLib = null;
    delete LivenessRef.faceTrackerLib;
    for (var key in LivenessRef.faceManager ){
      LivenessRef.faceManager[key] = null;
      delete LivenessRef.faceManager[key];
    }
    LivenessRef.faceManager = null;
    delete LivenessRef.faceManager;
    LivenessRef.resolution = null;
    delete LivenessRef.resolution;
    LivenessRef.test = null;
    delete LivenessRef.test;
  }

  LivenessRef.loadFaceTracker(function(){
    LivenessRef.prompts.setCurrentPhrase(currentPhrase);
  });
}
