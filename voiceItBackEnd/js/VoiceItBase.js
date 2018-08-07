const voiceit2 = require('./voiceItApiWrapper');
const fs = require('fs');
const ffmpeg = require('fluent-ffmpeg');
const path = require('path');

module.exports = function(config, server) {
  const myVoiceIt = new voiceit2(config.apiKey, config.apiToken);
  let io = require('socket.io').listen(server);
  var userID = config.userId;
  const rootAbsPath = path.resolve(__dirname, '../');

  var socket1Id;
  var socket2Id;

  //test stuff
  var tests = [0, 1, 2, 3, 4];
  var currTest;
  var time;
  var testIndex = 0;
  var passed = {
    test: -1,
    value: false
  };
  var oldTest = -1;
  var passedTests = 0;
  var oldVertices = [];
  var time = new Date().getTime();
  var face;
  var timeStampId;
  var timeStamps = [];
  var successTimeStamps = [];
  const numTests = config.numLivTests;
  var testTimer;
  var currTime;
  var type;
  var livTries = 0;
  const MAX_TRIES = config.maxLivTries;
  var doingLiveness = false;
  var checkForFaceStraight = false;
  var verificationTries = 0;
  const MAX_LIV_VER_TRIES = 2;
  var livFaceRecord;
  var livVoiceRecord;
  var timePassed;
  const maxScreenShots = 1;


  //counters
  var turnedRightCounter = 0;
  var turnedLeftCounter = 0;
  var yawnCounter = 0;
  var smileCounter = 0;
  var facedDownCounter = 0;

  //start timestamps for video
  function initTimeStamps() {
    if (timeStamps.length == 0) {
      timeStampId = setInterval(function() {
        var time = Date.now();
        timeStamps.push(time);
      }, 50);
    }
  }

  //helper to convert a point to a vector
  function Point(x, y) {
    this.x = x;
    this.y = y;

    this.distanceTo = function(point) {
      var distance = Math.sqrt((Math.pow(point.x - this.x, 2)) + (Math.pow(point.y - this.y, 2)))
      return distance;
    };
  }

  function stampToVidSeconds(timeStamps, allTimestamps) {
    for (var i = 0; i < timeStamps.length; i++) {
      timeStamps[i] = (timeStamps[i] - allTimestamps[0]) / 1000;
    }
  }

  //shuffle an array
  function shuffle(a) {
    var j, x, i;
    for (i = a.length - 1; i > 0; i--) {
      j = Math.floor(Math.random() * (i + 1));
      x = a[i];
      a[i] = a[j];
      a[j] = x;
    }
    return a;
  }

  //store previous vertices in array
  function storeVertices(vertices) {
    for (var i = 0, l = vertices.length; i < l; i++) {
      oldVertices[i] = vertices[i];
    }
  }

  //reset test counters
  function resetCounters() {
    turnedRightCounter = 0;
    turnedLeftCounter = 0;
    yawnCounter = 0;
    smileCounter = 0;
    facedDownCounter = 0;
  }

  //for a given test cass and face object, do liveness math
  function doLiveness(type, faceObj) {
    switch (type) {
      case 0:
        var face = faceObj.rotationX;
        var timeNew = new Date().getTime();
        if ((timeNew - testTimer) > 700) {
          if (face >= 0.25) {
            facedDownCounter++;
            if (facedDownCounter > 1) {
              passed.test = 0;
              passed.value = true;
              testTimer = Date.now();
            }
          } else if (faceObj.rotationY < -0.40 || faceObj.rotationY > 0.40) {
            livTries++;
            if (livTries > MAX_TRIES) {
              io.emit('stopRecording', 1);
              io.emit('completeLiveness', 0);
              doingLiveness = false;
            } else {
              doingLiveness = false;
              io.emit('completeLiveness', 1);
              testIndex += 1;

              if (testIndex > 4) {
                testIndex = 0;
              }
              currTest = tests[testIndex];
              setTimeout(function() {
                io.emit('reTest', currTest);
                doingLiveness = true;
                testTimer = Date.now();
              }, 2000);
            }
          }
        }
        break;
      case 1:
        var face = faceObj.rotationY;
        var timeNew = new Date().getTime();
        if ((timeNew - testTimer) > 700) {
          if (face < -0.40) {
            turnedRightCounter++;
            if (turnedRightCounter > 0) {
              passed.test = 1;
              passed.value = true;
              testTimer = Date.now();
            }
          } else if (faceObj.rotationY > 0.40) {
            livTries++;
            if (livTries > MAX_TRIES) {
              io.emit('completeLiveness', 0);
              doingLiveness = false;
            } else {
              doingLiveness = false;
              io.emit('completeLiveness', 1);
              testIndex += 1;

              if (testIndex > 4) {
                testIndex = 0;
              }
              currTest = tests[testIndex];
              setTimeout(function() {
                io.emit('reTest', currTest);
                doingLiveness = true;
                testTimer = Date.now();
              }, 2000);
            }
          }
        }
        break;
      case 2:
        var face = faceObj.rotationY;
        var timeNew = new Date().getTime();
        if ((timeNew - testTimer) > 700) {
          if (face > 0.40) {
            turnedLeftCounter++;
            if (turnedLeftCounter > 1) {
              passed.test = 2;
              passed.value = true;
              testTimer = Date.now();
            }
          } else if (faceObj.rotationY < -0.40) {
            livTries++;
            if (livTries > MAX_TRIES) {
              io.emit('completeLiveness', 0);
              doingLiveness = false;
            } else {
              doingLiveness = false;
              io.emit('completeLiveness', 1);
              testIndex += 1;

              if (testIndex > 4) {
                testIndex = 0;
              }
              currTest = tests[testIndex];
              setTimeout(function() {
                io.emit('reTest', currTest);
                doingLiveness = true;
                testTimer = Date.now();
              }, 2000);
            }
          }
        }
        break;
      case 3:
        var v = faceObj.vertices;
        var p0 = new Point(v[48 * 2], v[48 * 2 + 1]); // mouth corner left
        var p1 = new Point(v[54 * 2], v[54 * 2 + 1]); // mouth corner right

        var mouthWidth = p0.distanceTo(p1);

        p0 = new Point(v[39 * 2], v[39 * 2 + 1]); // mouth corner left
        p1 = new Point(v[42 * 2], v[42 * 2 + 1]); // mouth corner right

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
        var timeNew = new Date().getTime();
        if ((timeNew - testTimer) > 700) {
          if (smileFactor > 0.55) {
            smileCounter++;
            if (smileCounter > 1) {
              passed.test = 3;
              passed.value = true;
              testTimer = Date.now();
            }
          }
        }
        break;
      case 4:
        var v = faceObj.vertices;
        var p0 = new Point(v[39 * 2], v[39 * 2 + 1]); // left eye inner corner
        var p1 = new Point(v[42 * 2], v[42 * 2 + 1]); // right eye outer corner

        var eyeDist = p0.distanceTo(p1);

        p0 = new Point(v[62 * 2], v[62 * 2 + 1]); // mouth upper inner lip
        p1 = new Point(v[66 * 2], v[66 * 2 + 1]); // mouth lower inner lip

        var mouthOpen = p0.distanceTo(p1);

        var yawnFactor = mouthOpen / eyeDist;

        yawnFactor -= 0.35; // remove smiling

        if (yawnFactor < 0) yawnFactor = 0;

        yawnFactor *= 2.0;


        if (yawnFactor < 0.0) {
          yawnFactor = 0.0;
        }
        if (yawnFactor > 1.0) {
          yawnFactor = 1.0;
        }

        var timeNew = new Date().getTime();
        if ((timeNew - testTimer) > 700) {
          if (yawnFactor > 0.3) {
            yawnCounter++;
            if (yawnCounter > 1) {
              time = new Date().getTime();
              passed.test = 4;
              passed.value = true;
              testTimer = Date.now();
            }
          }
        }
        break;
      default:
    }
  }

  //switched to the respective api call
  function handleClientRequest(options) {
    var type = options.biometricType + options.action;
    switch (type) {
      case "voiceVerification":
        fs.appendFileSync(rootAbsPath + "/tempAssets/audio.wav", new Buffer.alloc(options.recording.length, options.recording));
        myVoiceIt.voiceVerification({
          userId: userID,
          contentLanguage: config.contentLanguage,
          audioFilePath: rootAbsPath + "/tempAssets/audio.wav",
          phrase: config.phrase
        }, (jsonResponse) => {
          var obj = {
            response: jsonResponse,
            type: type
          };
          console.log(jsonResponse);
          io.emit('requestResponse', obj);
          fs.unlink(rootAbsPath + '/tempAssets/audio.wav', (err) => {
            if (err) throw err;
          });
        });
        break;
      case "voiceEnrollment":
        fs.appendFileSync(rootAbsPath + "/tempAssets/audio.wav", new Buffer.alloc(options.recording.length, options.recording));
        myVoiceIt.createVoiceEnrollment({
          userId: userID,
          contentLanguage: config.contentLanguage,
          audioFilePath: rootAbsPath + "/tempAssets/audio.wav",
          phrase: config.phrase
        }, (jsonResponse) => {
          var obj = {
            response: jsonResponse,
            type: type
          };
          console.log(jsonResponse);
          io.emit('requestResponse', obj);
          fs.unlink(rootAbsPath + '/tempAssets/audio.wav', (err) => {
            if (err) throw err;
          });
        });
        break;
      case "faceEnrollment":
        fs.appendFileSync(rootAbsPath + "/tempAssets/video.mp4", new Buffer.alloc(options.recording.length, options.recording));
        myVoiceIt.createFaceEnrollment({
          userId: userID,
          videoFilePath: rootAbsPath + "/tempAssets/video.mp4"
        }, (jsonResponse) => {
          var obj = {
            response: jsonResponse,
            type: type
          };
          console.log(jsonResponse);
          io.emit('requestResponse', obj);
          fs.unlink(rootAbsPath + '/tempAssets/video.mp4', (err) => {
            if (err) throw err;
          });
        });
        break;
      case "faceVerification":
        fs.appendFileSync(rootAbsPath + "/tempAssets/video.mp4", new Buffer.alloc(options.recording.length, options.recording));
        myVoiceIt.faceVerification({
          userId: userID,
          contentLanguage: config.contentLanguage,
          videoFilePath: rootAbsPath + "/tempAssets/video.mp4"
        }, (jsonResponse) => {
          var obj = {
            response: jsonResponse,
            type: type
          };
          console.log(jsonResponse);
          io.emit('requestResponse', obj);
          fs.unlink(rootAbsPath + '/tempAssets/video.mp4', (err) => {
            if (err) throw err;
          });
        });
        break;
      case "videoEnrollment":
        var recording = options.recording.video;
        fs.appendFileSync(rootAbsPath + "/tempAssets/video.mov", new Buffer.alloc(recording.length, recording));
        myVoiceIt.createVideoEnrollment({
          userId: userID,
          contentLanguage: config.contentLanguage,
          videoFilePath: rootAbsPath + "/tempAssets/video.mov",
          phrase: config.phrase
        }, (jsonResponse) => {
          var obj = {
            response: jsonResponse,
            type: type
          };
          console.log(jsonResponse);
          io.emit('requestResponse', obj);
          fs.unlink(rootAbsPath + '/tempAssets/video.mov', (err) => {
            if (err) throw err;
          });
        });
        break;
      case "videoVerification":
        options.recording = options.recording.video;
        fs.appendFileSync(rootAbsPath + "/tempAssets/video.mov", new Buffer.alloc(options.recording.length, options.recording));
        myVoiceIt.videoVerification({
          userId: userID,
          contentLanguage: config.contentLanguage,
          videoFilePath: rootAbsPath + "/tempAssets/video.mov",
          phrase: config.phrase
        }, (jsonResponse) => {
          var obj = {
            response: jsonResponse,
            type: type
          };
          console.log(jsonResponse);
          io.emit('requestResponse', obj);
          fs.unlink(rootAbsPath + '/tempAssets/video.mov', (err) => {
            if (err) throw err;
          });
        });
        break;
      case "deleteEnrollments":
        myVoiceIt.deleteAllEnrollmentsForUser({
          userId: userID,
        }, (jsonResponse) => {
          console.log(jsonResponse);
          var obj = {
            response: jsonResponse,
            type: type
          };
          io.emit('requestResponse', obj);
        });
        break;
      case "getPhrases":
        myVoiceIt.getPhrases({
          lang: config.contentLanguage,
        }, (jsonResponse) => {
          console.log(jsonResponse);
          var obj = {
            response: jsonResponse,
            type: type
          };
          io.emit('requestResponse', obj);
        });
        break;
      default:
    }
  };

  //takes the picture upon liveness completion and makes liveness-related API calls
  function handleFaceLivenessCompletion(data) {
    //convert milliseconds stamps to in-video time
    stampToVidSeconds(successTimeStamps, timeStamps);
    console.log(data);
    fs.appendFileSync(rootAbsPath + "/tempAssets/vid.mp4", new Buffer.alloc(data.recording.length, data.recording));
    var reducedStamps = [];
    //round off to 2 significant figures
    for (var j = 0; j < 1; j++) {
      reducedStamps[j] = Math.round(successTimeStamps[j] * 10) / 10;
    }
    //take screenshots
    var proc = new ffmpeg(rootAbsPath + '/tempAssets/vid.mp4')
      .on('end', function(stdout, stderr) {
        doLivenessFaceCalls(data.recording);
      }).takeScreenshots({
        count: 1,
        filename: 'pic.png',
        timemarks: reducedStamps
      }, rootAbsPath + '/tempAssets', function(err) {
        console.log(err);
      });
  }

  function handleVidLivenessCompletion(data) {
    if (data.kind == "face") {
      livFaceRecord = data.recording;
    } else {
      //convert milliseconds stamps to in-video time
      stampToVidSeconds(successTimeStamps, timeStamps);
      fs.appendFileSync(rootAbsPath + "/tempAssets/vid.mp4", new Buffer.alloc(livFaceRecord.length, livFaceRecord));
      //round off to 2 significant figures
      var reducedStamps = [];
      //only one Faceshot for videoLiveness
      for (var j = 0; j < 1; j++) {
        reducedStamps[j] = Math.round(successTimeStamps[j] * 10) / 10;
      }
      var proc = new ffmpeg(rootAbsPath + '/tempAssets/vid.mp4')
        .on('end', function(stdout, stderr) {
          fs.unlink(rootAbsPath + '/tempAssets/vid.mp4', (err) => {
            if (err) throw err;
          });
          //get the audio
          fs.appendFileSync(rootAbsPath + "/tempAssets/vid2.mp4", new Buffer.alloc(data.recording.length, data.recording));
          ffmpeg(rootAbsPath + "/tempAssets/vid2.mp4")
            .output(rootAbsPath + "/tempAssets/audio.wav")
            .on('end', function() {
              //make the vid verification call
              myVoiceIt.videoVerificationLiv({
                userId: userID,
                contentLanguage: config.contentLanguage,
                photoFilePath: rootAbsPath + "/tempAssets/pic.png", //from liveness
                audioFilePath: rootAbsPath + "/tempAssets/audio.wav" //audio
              }, (jsonResponse) => {
                console.log(jsonResponse);
                if (jsonResponse.responseCode == "SUCC") {
                  io.emit('completeLiveness', 3);
                } else {
                  io.emit('completeLiveness', 2);
                }
                fs.unlink(rootAbsPath + '/tempAssets/vid2.mp4', (err) => {
                  if (err) throw err;
                });
                fs.unlink(rootAbsPath + '/tempAssets/audio.wav', (err) => {
                  if (err) throw err;
                });
                fs.unlink(rootAbsPath + '/tempAssets/pic.png', (err) => {
                  if (err) throw err;
                });
              });
            }).on('error', function(e) {
              console.log('error: ', e.code, e.msg);
            }).run();
        }).takeScreenshots({
          count: 1,
          filename: 'pic.png',
          timemarks: reducedStamps //number of seconds
        }, rootAbsPath + '/tempAssets', function(err) {
          console.log(err);
        });
    }
  }

  function doLivenessFaceCalls(data) {
    var responses = 2;
    var passes = 0;
    var fails = 0;
    var curr = 0;
    var emitted = false;
    for (var i = 1; i <= 1; i++) {
      myVoiceIt.faceVerificationLiv({
        userId: userID,
        contentLanguage: config.contentLanguage,
        photo: rootAbsPath + "/tempAssets/pic.png"
      }, (jsonResponse) => {
        curr++;
        console.log(jsonResponse);
        var obj = {
          response: jsonResponse,
          type: type
        };
        if (jsonResponse.responseCode == "SUCC") {
          passes++;
          if (passes >= 1) {
            if (!emitted) {
              io.emit('completeLiveness', 3);
              emitted = true;
            }
          }
        } else {
          fails++;
          if (fails >= 1) {
            io.emit('completeLiveness', 2);
          }
        }
        if (curr >= responses) {
          removeFiles(responses);
        }
      });
    }
  }

  function doLivenessVidCalls(recording) {
    fs.appendFileSync(rootAbsPath + "/tempAssets/vid2.mp4", new Buffer.alloc(recording.length, recording));
    ffmpeg(rootAbsPath + "/tempAssets/vid2.mp4")
      .output(rootAbsPath + "/tempAssets/audio.wav")
      .on('end', function() {

        myVoiceIt.voiceVerification({
          userId: userID,
          contentLanguage: config.contentLanguage,
          audioFilePath: rootAbsPath + "/tempAssets/audio.wav",
          phrase: config.phrase
        }, (jsonResponse) => {
          console.log(jsonResponse);
          var obj = {
            response: jsonResponse,
            type: type
          };
          if (jsonResponse.responseCode == "SUCC") {
            io.emit("completeLiveness", 3);
          } else {
            io.emit("completeLiveness", 2);
          }
          fs.unlink(rootAbsPath + '/tempAssets/vid2.mp4', (err) => {
            if (err) throw err;
          });
          fs.unlink(rootAbsPath + '/tempAssets/audio.wav', (err) => {
            if (err) throw err;
          });
        });

      }).on('error', function(e) {
        console.log('error: ', e.code, e.msg);
      }).run();


  }

  function removeFiles(num) {
    for (var i = 1; i <= maxScreenShots; i++) {
      fs.unlink(rootAbsPath + "/tempAssets/pic.png", (err) => {
        if (err) throw err;
      });
    }
    fs.unlink(rootAbsPath + "/tempAssets/vid.mp4", (err) => {
      if (err) throw err;
    });
  }

  function resetAll(data) {
    tests = shuffle(tests);
    testTimer = Date.now();
    testIndex = 0;
    currTest = tests[testIndex];
    oldTst = currTest;
    passed = {
      test: -1,
      value: false
    };
    passedTests = 0;
    timeStamps = [];
    successTimeStamps = [];
    currTime = 0;
    type = data.type;
    livTries = 0;
    doingLiveness = true;
    checkForFaceStraight = false;
    verificationTries = 0;
    livFaceRecord = 0;
    livVoiceRecord = 0;
    timePassed = 0;
    resetCounters();
  }


  //Handle client-server communication
  io.on('connection', function(socket) {
    socket.on('initLiveness', function(){
      socket2Id = socket.id;
    });
    socket.on('requestEnrollmentDetails', function(request){
      socket1Id = socket.id;
      myVoiceIt.getAllEnrollmentsForUser({
        userId: userID
      }, (jsonResponse) => {
        console.log(jsonResponse);
        if (jsonResponse.count < 3) {
          var obj = {
            type: "voice",
            code: 1
          }
        } else {
          var obj = {
            type: "voice",
            code: 0
          }
        }
        io.emit('enrollmentNeeded', obj);
      });
      myVoiceIt.getFaceEnrollmentsForUser({
        userId: userID
      }, (jsonResponse) => {
        console.log(jsonResponse);
        if (jsonResponse.count < 1) {
          var obj = {
            type: "face",
            code: 1
          }
        } else {
          var obj = {
            type: "face",
            code: 0
          }
        }
        io.emit('enrollmentNeeded', obj);
      });
    });

    //initiate lvieness event from cleint
    socket.on('initiate', function(data) {
      resetAll(data);
      initTimeStamps();
      io.emit('initiated', currTest);
    });

    //date event from client
    socket.on('data', function(faceObject) {
      //TODO: Add timeOut when face isn't detected!
      if (doingLiveness) {
        currTime = Date.now();
        //liveness test timed out
        if ((currTime - testTimer) > 3000) {
          livTries++;
          if (livTries > MAX_TRIES) {
            socket.emit('completeLiveness', 0);
            doingLiveness = false;
          } else {
            doingLiveness = false;
            socket.emit('completeLiveness', 1);
            testIndex += 1;

            if (testIndex > 4) {
              testIndex = 0;
            }
            currTest = tests[testIndex];
            setTimeout(function() {
              io.emit('reTest', currTest);
              doingLiveness = true;
              testTimer = Date.now();
            }, 2000);
          }
        }
        face = faceObject;
        doLiveness(currTest, face);
        if (passed.value) {
          passedTests++;
          testIndex += 1;
          if (testIndex > 4) {
            testIndex = 0;
          }
          oldTest = currTest;
          currTest = tests[testIndex];
          if (passedTests < numTests) {
            io.emit('test', currTest);
            if (oldTest < 3) {
              timePassed = Date.now();
              checkForFaceStraight = true;
            } else if (oldTest >= 3) {
              checkForFaceStraight = false;
              if (successTimeStamps.length < numTests) {
                successTimeStamps.push(timeStamps[timeStamps.length - 1]);
              }
            }
            resetCounters();
          } else {
            if (oldTest < 3) {
              timePassed = Date.now();
              checkForFaceStraight = true;
              io.emit('completeLiveness', 7);
            } else if (oldTest >= 3) {
              if (type == "face") {
                io.emit('completeLiveness', 4);
              } else {
                io.emit('completeLiveness', 6);
              }
              if (successTimeStamps.length < numTests) {
                successTimeStamps.push(timeStamps[timeStamps.length - 1]);
              }
              io.emit('stopRecording', 1);
              if (type == "video") {
                setTimeout(function() {
                  io.emit('completeLiveness', 5);
                }, 100);
              } else {}
              doingLiveness = false;
            }
          }
          passed.value = false;
        }

        //wait for face back
        if (checkForFaceStraight) {
          if (face.rotationY < 0.1 && face.rotationY > -0.1 && face.rotationX < 0.10 || Date.now() - timePassed > 1200) {
            if (successTimeStamps.length < numTests) {
              successTimeStamps.push(timeStamps[timeStamps.length - 1]);
            }
            if (passedTests >= numTests) {
              if (type == "face") {
                io.emit('completeLiveness', 4);
              } else {
                io.emit('completeLiveness', 6);
              }
              successTimeStamps[successTimeStamps.length - 1] = successTimeStamps[successTimeStamps.length - 1] - 100;
              io.emit('stopRecording', 1);
              if (type == "video") {
                setTimeout(function() {
                  io.emit('completeLiveness', 5);
                }, 100);
              } else {}
              doingLiveness = false;
            } else {
              resetCounters();
            }
            checkForFaceStraight = false;
            timePassed = 0;
          }
        }
      }
    });

    //Api request from client
    socket.on('apiRequest', function(options) {
      handleClientRequest(options);
    });

    //recorded data from client
    socket.on('recording', function(data) {
      data.recording = data.recording.video;
      if (data.kind !== "voice") {
        clearInterval(timeStampId);
      }
      if (type == "face") {
        handleFaceLivenessCompletion(data);
      } else if (type == "video" && data.kind == "face") {
        handleVidLivenessCompletion(data);
      } else if (type == "video" && data.kind == "voice") {
        handleVidLivenessCompletion(data);
      }
    });

    //timestamps of the recording
    socket.on('timestamp', function(c) {
      initTimeStamps();
    });
    socket.on('terminate', function() {
      doingLiveness = false;
    });
  });
}
