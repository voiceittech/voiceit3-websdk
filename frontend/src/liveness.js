import vi$ from './utilities';
import Prompts from './prompts';
import LivenessMath from './livenessMath';
const LIVENESS_TEST_TIMEOUT = 3500;
import Colors from './colors';

export default function Liveness(VoiceItObj) {
  const LivenessRef = this;
  const modal = VoiceItObj.modal;
  const currentPhrase = VoiceItObj.phrase;
  const _isWebAssemblySupported = vi$.isWebAssemblySupported();
  LivenessRef.animationId = 0;
  LivenessRef.manyfaces = false;
  LivenessRef.livenessStarted = false;
  LivenessRef.finished = false;

  // Refactor prompts to be prop on modal object
  LivenessRef.prompts = new Prompts();
  LivenessRef.cancel = false;
  LivenessRef.allPassed = false;
  LivenessRef.picturesCaptured = false;
  LivenessRef.continueToVoice = true;
  LivenessRef.oldCircles = [];
  LivenessRef.setup = false;
  LivenessRef.imageDataCtx = modal.domRef.imageCanvas.getContext('2d');
  LivenessRef.faceManager = undefined;
  LivenessRef.resolution = null;
  LivenessRef.test;

  LivenessRef.setupVariables = function(testType){
    LivenessRef.tests = vi$.shuffle( [1, 2]);// TODO: 3 Smile Disabled 0 Down and 4 Yawn Tests Disabled
    LivenessRef.testTimeStart = Date.now();
    LivenessRef.currentTest = LivenessRef.tests[0];
    LivenessRef.testIndex = 0;
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
    LivenessRef.checkForFaceStraight = false;
    LivenessRef.verificationTries = 0;
    LivenessRef.successPic = null;
    LivenessRef.timePassed = 0;
    // Liveness counters
    LivenessRef.turnedRightCounter = 0;
    LivenessRef.turnedLeftCounter = 0;
    LivenessRef.yawnCounter = 0;
    LivenessRef.smileCounter = 0;
    LivenessRef.facedDownCounter = 0;
    LivenessRef.faceOtherWayCounter = 0;
    LivenessRef.continueToVoice = true;
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

  LivenessRef.snapLivenessPic = function(callback){
    modal.domRef.imageCanvas.toBlob(function(imageBlob){
      LivenessRef.successPic = imageBlob;
      LivenessRef.picturesCaptured = true;
      if(LivenessRef.allPassed){
          VoiceItObj.onFinishLivenessFaceVerification();
      }
    });
  };

  LivenessRef.startLiveness = function(testType){
    if(LivenessRef.livenessStarted){ return; }
    LivenessRef.setupVariables();
    LivenessRef.livenessStarted = true;
    LivenessRef.type = testType;
    modal.createLivenessCircle();
    LivenessRef.drawCircle(LivenessRef.currentTest);
  };

  LivenessRef.tryAgain = function(turnBack){
    LivenessRef.testIndex = LivenessRef.testIndex >= (LivenessRef.tests.length - 1) ? 0 : LivenessRef.testIndex + 1;
    LivenessRef.currentTest = LivenessRef.tests[LivenessRef.testIndex];
    LivenessRef.livenessRetest(LivenessRef.currentTest);
    LivenessRef.testTimeStart = Date.now();
    modal.hideProgressCircle(300);
    modal.darkenCircle(true);
    modal.displayMessage(LivenessRef.prompts.getPrompt(turnBack ? "LIVENESS_TRY_AGAIN_AND_TURN_BACK" : "LIVENESS_TRY_AGAIN"));
    LivenessRef.passed.value = false;
  };

  LivenessRef.passedLivenessTest = function(){
    LivenessRef.cancel = true;
    // Show waiting, post liveness success
    modal.updateProgressCircle(modal.domRef.progressCircle, LivenessRef.oldCircles[0], Colors.MAIN_THEME_COLOR);
    vi$.qs(modal.domRef.progressCircle).style.transform = LivenessRef.oldCircles[1];
  };

  LivenessRef.passedAllFaceLivenessTests = function(){
    LivenessRef.allPassed = true;
    modal.updateProgressCircle(modal.domRef.progressCircle, LivenessRef.oldCircles[0], Colors.MAIN_THEME_COLOR);
    vi$.qs(modal.domRef.progressCircle).style.transform = LivenessRef.oldCircles[1];
    setTimeout(function() {
      modal.hideProgressCircle(300, function() {
        modal.domRef.progressCircle.style.display = 'none';
      });
    }, 300);
    modal.darkenCircle(true);
    LivenessRef.cancel = true;
    if(LivenessRef.allPassed && LivenessRef.picturesCaptured){
        VoiceItObj.onFinishLivenessFaceVerification();
    }
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
    LivenessRef.continueToVoice = false;
    LivenessRef.cancel = true;
    // Failed liveness
    vi$.fadeOut(modal.domRef.progressCircle, 300, function(){
        modal.domRef.progressCircle.style.display = 'none';
    });

    modal.darkenCircle(true);
    modal.displayMessage(LivenessRef.prompts.getPrompt("LIVENESS_FAILED"));
    VoiceItObj.exitOut();
  }

  // LivenessRef.trackfaces = function() {
  //   if (!LivenessRef.cancel){
  //     const imageArray = LivenessRef.imageDataCtx.getImageData(0, 0, LivenessRef.resolution.width, LivenessRef.resolution.height).data;
  //     LivenessRef.faceManager.update(imageArray);
  //     const faces = LivenessRef.faceManager.getFaces();
  //     if(faces.length > 0){
  //       LivenessRef.livenessCheck(faces[0], function(){
  //         // Failed Callback
  //       });
  //     }
  //     LivenessRef.animationId = window.requestAnimationFrame(LivenessRef.trackfaces);
  //   }
  // }

  LivenessRef.livenessRetest = function(){
    LivenessRef.redrawCircle(LivenessRef.currentTest);
    modal.darkenCircle(true);
  }

  LivenessRef.livenessCheck = function(pose) {
    const faceObject = {
      minPartConfidence : 0.5,
      nose : pose.keypoints[0],
      leftEye : pose.keypoints[1],
      rightEye : pose.keypoints[2],
      leftEar : pose.keypoints[3],
      rightEar : pose.keypoints[4],
      eyeMidPoint : (pose.keypoints[2].position.x - pose.keypoints[1].position.x) / 2.0 + pose.keypoints[1].position.x
    };

    const timeDiff = Date.now() - LivenessRef.testTimeStart;
    const testTimedOut = timeDiff > LIVENESS_TEST_TIMEOUT;
    // If Test timed out retry
    if (testTimedOut) {
      LivenessRef.livenessTries++;
      // If Failed More Liveness test than tries then fail
      if (LivenessRef.livenessTries > LivenessRef.MAX_TRIES) {
        // failedCallback();
        // TODO: Failed Callback
      }
      // Otherwise retry liveness tests
      else {
        LivenessRef.tryAgain();
        LivenessRef.testIndex = LivenessRef.testIndex >= (LivenessRef.tests.length - 1) ? 0 : LivenessRef.testIndex + 1;
        LivenessRef.currentTest = LivenessRef.tests[LivenessRef.testIndex];
        setTimeout(function() {
          LivenessRef.livenessRetest();
          LivenessRef.testTimeStart = Date.now();
        }, 2000);
      }
    } else {
      // While liveness tests not passed keep processing faceObjects
      if (LivenessRef.passedTests < LivenessRef.numTests) {
        LivenessMath.processFaceObject(LivenessRef, faceObject, function(){
          LivenessRef.failedLiveness();
        });
      // If Liveness Test Passed
      if (LivenessRef.passed.value) {
          LivenessRef.testIndex = LivenessRef.testIndex >= (LivenessRef.tests.length - 1) ? 0 : LivenessRef.testIndex + 1;
          LivenessRef.oldTest = LivenessRef.currentTest;
          LivenessRef.currentTest = LivenessRef.tests[LivenessRef.testIndex];

          if (LivenessRef.passedTests < LivenessRef.numTests) {
            if (LivenessRef.cancel){
              LivenessRef.cancel = false;
            }
            LivenessRef.redrawCircle(LivenessRef.currentTest);
            LivenessRef.resetLivenessCounters();
        } else {

          if (LivenessRef.type === "face") {
            LivenessRef.passedAllFaceLivenessTests();
          } else if (LivenessRef.type === "video" && LivenessRef.continueToVoice) {
            LivenessRef.passedAllVideoLivenessTests();
            LivenessRef.finished = true;
            VoiceItObj.passedLiveness = true;
            VoiceItObj.continueToVoiceVerification();
          }
        }

        LivenessRef.passed.value = false;
      }
    }
  }
}

  LivenessRef.resume = function() {
    LivenessRef.stop = false;
    LivenessRef.setup = true;
    LivenessRef.cancel = false;
    // LivenessRef.trackfaces();
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
    LivenessRef.test = null;
    delete LivenessRef.test;
  }
}
