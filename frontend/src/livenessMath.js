// For a given test case and face object, do liveness math
const TIME_TO_WAIT_FOR_FACE_TURN = 2600; // time in ms

// Point object used for vector math
function Point(x, y) {
  this.x = x;
  this.y = y;

  this.distanceTo = (point) => {
    return Math.sqrt((Math.pow(point.x - this.x, 2)) + (Math.pow(point.y - this.y, 2)))
  };
}

const LivenessMath = {
  processFaceObject: function(LivenessObjRef, faceObj, livenessFailedCallback) {
    const type = LivenessObjRef.currentTest;
    const newTime = new Date().getTime();
    const v = faceObj.vertices;
    switch (type) {
        // Looking Right Logic
      case 1:
        if ((newTime - LivenessObjRef.testTimeStart) > 750) {
          if (faceObj.rotationY < -0.40) {
            LivenessObjRef.turnedRightCounter++;
            if (LivenessObjRef.turnedRightCounter > 1) {
              LivenessObjRef.passed.test = type;
              LivenessObjRef.passed.value = true;
              LivenessObjRef.testTimeStart = Date.now();
            }
          } else if (faceObj.rotationY > 0.46) {
            LivenessObjRef.faceOtherWayCounter++;
            if (LivenessObjRef.faceOtherWayCounter > 2) {
              LivenessObjRef.livenessTries++;
              LivenessObjRef.doingLiveness = false;
              if (LivenessObjRef.livenessTries > LivenessObjRef.MAX_TRIES) {
                livenessFailedCallback();
              } else {
                LivenessObjRef.tryAgain(true);
                LivenessObjRef.testIndex++;
                if (LivenessObjRef.testIndex > 3) {
                  LivenessObjRef.testIndex = 0;
                }
                LivenessObjRef.currentTest = LivenessObjRef.tests[LivenessObjRef.testIndex];

                setTimeout(function() {
                  LivenessObjRef.livenessRetest(LivenessObjRef.currentTest);
                  LivenessObjRef.testTimeStart = Date.now();
                  LivenessObjRef.doingLiveness = true;
                }, TIME_TO_WAIT_FOR_FACE_TURN);

              }
              LivenessObjRef.faceOtherWayCounter = 0;
            }
          }
        }
        break;
        // Looking Left Logic
      case 2:
        if ((newTime - LivenessObjRef.testTimeStart) > 750) {
          if (faceObj.rotationY > 0.40) {
            LivenessObjRef.turnedLeftCounter++;
            if (LivenessObjRef.turnedLeftCounter > 1) {
              LivenessObjRef.passed.test = type;
              LivenessObjRef.passed.value = true;
              LivenessObjRef.testTimeStart = Date.now();
            }
          } else if (faceObj.rotationY < -0.46) {
            LivenessObjRef.faceOtherWayCounter++;
            if (LivenessObjRef.faceOtherWayCounter > 2) {
              LivenessObjRef.livenessTries++;
              LivenessObjRef.doingLiveness = false;
              if (LivenessObjRef.livenessTries > LivenessObjRef.MAX_TRIES) {
                livenessFailedCallback();
              } else {
                LivenessObjRef.tryAgain(true);
                LivenessObjRef.testIndex++;
                if (LivenessObjRef.testIndex > 3) {
                  LivenessObjRef.testIndex = 0;
                }
                LivenessObjRef.currentTest = LivenessObjRef.tests[LivenessObjRef.testIndex];

                setTimeout(function() {
                  LivenessObjRef.livenessRetest(LivenessObjRef.currentTest);
                  LivenessObjRef.testTimeStart = Date.now();
                  LivenessObjRef.doingLiveness = true;
                }, TIME_TO_WAIT_FOR_FACE_TURN);

              }
              LivenessObjRef.faceOtherWayCounter = 0;
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
              LivenessObjRef.passed.test = type;
              LivenessObjRef.passed.value = true;
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
              LivenessObjRef.passed.test = type;
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
