// For a given test case and face object, do liveness math
const TIME_TO_WAIT_FOR_FACE_TURN = 2600; // time in ms
const TIME_BEFORE_PROCESSING_FACE = 650;
const NUMBER_OF_FRAMES_TO_CONCLUDE_LIVENESS_RESULT = 6;
// Point object used for vector math
function Point(x, y) {
  this.x = x;
  this.y = y;

  this.distanceTo = (point) => {
    return Math.sqrt((Math.pow(point.x - this.x, 2)) + (Math.pow(point.y - this.y, 2)))
  };
}

const LivenessMath = {
  // if ((Math.abs(faceObject.nose.position.x - faceObject.eyeMidPoint) < 9) || (timeNow - LivenessRef.timePassed > 1000)) {
  processFaceObject: function(LivenessObjRef, faceObj, livenessFailedCallback) {
    const type = LivenessObjRef.currentTest;
    const newTime = new Date().getTime();
    const v = faceObj.vertices;
    switch (type) {
        // Looking Right Logic
      case 1:
        if ((newTime - LivenessObjRef.testTimeStart) > TIME_BEFORE_PROCESSING_FACE) {
          if (faceObj.nose.position.x > faceObj.eyeMidPoint && (faceObj.leftEar.score < faceObj.minPartConfidence)) {
            LivenessObjRef.turnedRightCounter++;
            if (LivenessObjRef.turnedRightCounter > NUMBER_OF_FRAMES_TO_CONCLUDE_LIVENESS_RESULT) {
                LivenessObjRef.passed.value = true;
                LivenessObjRef.passedTests++;
                LivenessObjRef.testTimeStart = Date.now();
            }
          }
          // Snap Pic if Straight Face
          else if(Math.abs(faceObj.nose.position.x - faceObj.eyeMidPoint) < 9){
              LivenessObjRef.snapLivenessPic();
          } else if (faceObj.nose.position.x < faceObj.eyeMidPoint && (faceObj.rightEar.score < faceObj.minPartConfidence)) {
            LivenessObjRef.faceOtherWayCounter++;
            if (LivenessObjRef.faceOtherWayCounter > NUMBER_OF_FRAMES_TO_CONCLUDE_LIVENESS_RESULT) {
              LivenessObjRef.faceOtherWayCounter = 0;
              LivenessObjRef.livenessTries++;
              LivenessObjRef.passed.value = false;
              if (LivenessObjRef.livenessTries > LivenessObjRef.MAX_TRIES) {
                livenessFailedCallback();
              } else {
                LivenessObjRef.tryAgain(true);
              }

            }
          }
        }
        break;
        // Looking Left Logic
      case 2:
        if ((newTime - LivenessObjRef.testTimeStart) > TIME_BEFORE_PROCESSING_FACE) {
          if (faceObj.nose.position.x < faceObj.eyeMidPoint && (faceObj.rightEar.score < faceObj.minPartConfidence)) {
            LivenessObjRef.turnedLeftCounter++;
            if (LivenessObjRef.turnedLeftCounter > NUMBER_OF_FRAMES_TO_CONCLUDE_LIVENESS_RESULT) {
              LivenessObjRef.passed.value = true;
              LivenessObjRef.passedTests++;
              LivenessObjRef.testTimeStart = Date.now();
            }
          }
          // Snap Pic if Straight Face
          else if(Math.abs(faceObj.nose.position.x - faceObj.eyeMidPoint) < 9){
              LivenessObjRef.snapLivenessPic();
          } else if (faceObj.nose.position.x > faceObj.eyeMidPoint && (faceObj.leftEar.score < faceObj.minPartConfidence)) {
            LivenessObjRef.faceOtherWayCounter++;
            if (LivenessObjRef.faceOtherWayCounter > NUMBER_OF_FRAMES_TO_CONCLUDE_LIVENESS_RESULT) {
              LivenessObjRef.faceOtherWayCounter = 0;
              LivenessObjRef.livenessTries++;
              if (LivenessObjRef.livenessTries > LivenessObjRef.MAX_TRIES) {
                livenessFailedCallback();
              } else {
                LivenessObjRef.tryAgain(true);
              }

            }
          }
        }
        break;
        // Smile Logic
      case 3:
        var p0 = new Point(v[48 * 2], v[48 * 2 + 1]); // mouth corner left
        var p1 = new Point(v[54 * 2], v[54 * 2 + 1]); // mouth corner right

        const mouthWidth = p0.distanceTo(p1);

        p0 = new Point(v[39 * 2], v[39 * 2 + 1]); // left eye inner corner
        p1 = new Point(v[42 * 2], v[42 * 2 + 1]); // right eye outer corner

        var eyeDist = p0.distanceTo(p1);

        var smileFactor = mouthWidth / eyeDist;
        smileFactor -= 1.40; // 1.40 - neutral, 1.70 smiling
        smileFactor *= 4.0;

        if (smileFactor < 0.0) {
          smileFactor = 0.0;
        }
        if (smileFactor > 1.0) {
          smileFactor = 1.0;
        }

        if ((newTime - LivenessObjRef.testTimeStart) > 650) {
          if (smileFactor > 0.55) {
            LivenessObjRef.smileCounter++;
            if (LivenessObjRef.smileCounter > 1) {
              LivenessObjRef.passed.value = true;
              LivenessObjRef.passedTests++;
              LivenessObjRef.testTimeStart = Date.now();
            }
          }
        }
        break;
        // Yawn Logic
      case 4:
        var p0 = new Point(v[39 * 2], v[39 * 2 + 1]); // left eye inner corner
        var p1 = new Point(v[42 * 2], v[42 * 2 + 1]); // right eye outer corner

        var eyeDist = p0.distanceTo(p1);

        p0 = new Point(v[62 * 2], v[62 * 2 + 1]); // mouth upper inner lip
        p1 = new Point(v[66 * 2], v[66 * 2 + 1]); // mouth lower inner lip

        const mouthOpen = p0.distanceTo(p1);

        var yawnFactor = mouthOpen / eyeDist;
        yawnFactor -= 0.35; // remove smiling
        if (yawnFactor < 0) {
          yawnFactor = 0;
        }
        yawnFactor *= 2.0;
        if (yawnFactor < 0.0) {
          yawnFactor = 0.0;
        }
        if (yawnFactor > 1.0) {
          yawnFactor = 1.0;
        }
        if ((newTime - LivenessObjRef.testTimeStart) > 650) {
          if (yawnFactor > 0.3) {
            LivenessObjRef.yawnCounter++;
            if (LivenessObjRef.yawnCounter > 1) {
              LivenessObjRef.passed.value = true;
              LivenessObjRef.testTimeStart = Date.now();
            }
          }
        }
        break;
      default:
    }
  }
};

export default LivenessMath;
