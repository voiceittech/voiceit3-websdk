const voiceit2 = require('./voiceItApiWrapper');
const fs = require('fs');
const ffmpeg = require('fluent-ffmpeg');
const path = require('path');
const EventEmitter = require('events');
const util = require('util');
const uuid = require('uuid/v1');


function voiceItModule (config, server, session) {
  this.ongoingTasks = {};
  this.tasks = {};
  var main = this;
  const myVoiceIt = new voiceit2(config.apiKey, config.apiToken);
  let io = require('socket.io').listen(server, {
    wsEngine: 'ws'
  });
  io.on('connection', function(socket){
    socket.on('initFrontObj', function(){
      //get the session ID here, and instansiate the task that corresponds to that session ID.
      var taskOptions = main.getTaskOptions(socket.request.sessionID);
      if (taskOptions !== undefined){
        taskOptions.socketId = socket.id;
        var sessId = socket.request.sessionID;
        main.ongoingTasks[sessId] = new main.taskCreator(taskOptions);
      }
    });

    socket.on('disconnect', function(){
      setTimeout(function(){
        main.removeTask(socket.request.sessionID);
      },200);
    });
  });

  io.use(function(socket, next) {
    session(socket.request, {}, next);
  });

  const rootAbsPath = path.resolve(__dirname, '../');

  this.removeTask = function(sessionId) {
    if (main.ongoingTasks[sessionId] !== undefined){
      delete main.ongoingTasks[sessionId]
      }
    if (main.tasks[sessionId] !== undefined) {
      delete main.tasks[sessionId];
    }
  }

  this.getTaskOptions = function(sessionID) {
    if (main.tasks[sessionID] !== undefined){
      return main.tasks[sessionID].getOptions();
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

  this.task = function (config2){
    var main2 = this;
    this.sessionId = config2.sessionID;
    this.userID = config2.userId;
    this.contentLanguage = config2.contentLanguage;
    this.phrase = config2.phrase;
    var sessId = config2.sessionID;
    main.tasks[sessId] = this;
    this.getOptions = function (){
      return {
      sessionID: main2.sessionId,
      userId: main2.userID,
      contentLanguage: main2.contentLanguage,
      phrase: main2.phrase
    }};
  }

  this.taskCreator = function(config2) {
    this.phrase = config2.phrase;
    this.userID = config2.userId;
    this.sessionId = config2.sessionID;
    this.socketID = config2.socketId;
    EventEmitter.call(this);
    var main2 = this;
    main2.socketFrontId;
    //test stuff
    main2.tests = [0, 1, 2, 3, 4];
    main2.currTest;
    main2.testIndex = 0;
    main2.passed = {
      test: -1,
      value: false
    };
    main2.oldTest = -1;
    main2.passedTests = 0;
    main2.oldVertices = [];
    main2.face;
    main2.timeStampId;
    main2.timeStamps = [];
    main2.successTimeStamps = [];
    main2.numTests = config.numLivTests;
    main2.testTimer;
    main2.currTime;
    main2.type;
    main2.livTries = 0;
    main2.MAX_TRIES = config.maxLivTries;
    main2.doingLiveness = false;
    main2.checkForFaceStraight = false;
    main2.verificationTries = 0;
    main2.MAX_LIV_VER_TRIES = 2;
    main2.livFaceRecord;
    main2.livVoiceRecord;
    main2.timePassed;
    main2.maxScreenShots = 1;
    main2.passedAll = false;
    //counters
    main2.turnedRightCounter = 0;
    main2.turnedLeftCounter = 0;
    main2.yawnCounter = 0;
    main2.smileCounter = 0;
    main2.facedDownCounter = 0;
    main2.faceOtherWayCounter = 0;

    //start timestamps for video
    main2.initTimeStamps = function() {
      main2.timeStamps = [];
        main2.timeStampId = setInterval(function() {
        var time = Date.now();
        main2.timeStamps.push(time);
    },50);
  }

   main2.stampToVidSeconds = function(timeStamps, allTimestamps) {
      for (var i = 0; i < timeStamps.length; i++) {
        timeStamps[i] = (timeStamps[i] - allTimestamps[0]) / 1000;
      }
    }

    //shuffle an array
    main2.shuffle = function(a) {
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
    main2.storeVertices = function(vertices) {
      for (var i = 0, l = vertices.length; i < l; i++) {
        main2.oldVertices[i] = vertices[i];
      }
    }

    //reset test counters
    main2.resetCounters = function() {
      main2.turnedRightCounter = 0;
      main2.turnedLeftCounter = 0;
      main2.yawnCounter = 0;
      main2.smileCounter = 0;
      main2.facedDownCounter = 0;
      main2.faceOtherWayCounter = 0;
    }

    //for a given test cass and face object, do liveness math
    main2.doLiveness = function(type, faceObj) {
      switch (type) {
        case 0:
          var face = faceObj.rotationX;
          var timeNew = new Date().getTime();
          if ((timeNew - main2.testTimer) > 750) {
            if (face >= 0.35) {
              main2.facedDownCounter++;
              if (main2.facedDownCounter > 1) {
                main2.passed.test = 0;
                main2.passed.value = true;
                main2.testTimer = Date.now();
              }
            } else if (faceObj.rotationY < -0.40 || faceObj.rotationY > 0.40) {
              main2.faceOtherWayCounter++;
              if (main2.faceOtherWayCounter > 2){
                main2.livTries++;
                main2.doingLiveness = false;
                if (main2.livTries > main2.MAX_TRIES) {
                  io.to(main2.socketID).emit('stopRecording', 0);
                  io.to(main2.socketID).emit('completeLiveness', 0);
                  main2.doingLiveness = false;
                  var obj = {
                    sessionId: main2.sessionId,
                    type: main2.type,
                    livenessOutcome: "failed"
                  };
                  main.emit('result', obj);
                } else {
                  io.to(main2.socketID).emit('completeLiveness', 1.5);
                  main2.testIndex += 1;
                  if (main2.testIndex > 4) {
                    main2.testIndex = 0;
                  }
                  main2.currTest = main2.tests[main2.testIndex];
                  setTimeout(function() {
                    io.to(main2.socketID).emit('reTest', main2.currTest);
                    main2.testTimer = Date.now();
                    setTimeout(() => {
                      main2.doingLiveness = true;
                    },300);
                  }, 2600);
                }
                main2.faceOtherWayCounter = 0;
              }
            }
          }
          break;
        case 1:
          var face = faceObj.rotationY;
          timeNew = new Date().getTime();
          if ((timeNew - main2.testTimer) > 750) {
            if (face < -0.40) {
              main2.turnedRightCounter++;
              if (main2.turnedRightCounter > 1) {
                main2.passed.test = 1;
                main2.passed.value = true;
                main2.testTimer = Date.now();
              }
            } else if (faceObj.rotationY > 0.40) {
              main2.faceOtherWayCounter++;
              if (main2.faceOtherWayCounter > 2){
                main2.livTries++;
                main2.doingLiveness = false;
              if (main2.livTries > main2.MAX_TRIES) {
                io.to(main2.socketID).emit('stopRecording', 0);
                io.to(main2.socketID).emit('completeLiveness', 0);
                main2.doingLiveness = false;
                var obj = {
                  sessionId: main2.sessionId,
                  type: main2.type,
                  livenessOutcome: "failed"
                };
                main.emit('result', obj);
              } else {
                io.to(main2.socketID).emit('completeLiveness', 1.5);
                main2.testIndex += 1;
                if (main2.testIndex > 4) {
                  main2.testIndex = 0;
                }
                main2.currTest = main2.tests[main2.testIndex];
                setTimeout(function() {
                  io.to(main2.socketID).emit('reTest', main2.currTest);
                  main2.testTimer = Date.now();
                  setTimeout(() => {
                    main2.doingLiveness = true;
                  },300);
                }, 2600);
              }
              main2.faceOtherWayCounter = 0;
              }
            }
          }
          break;
        case 2:
          var face = faceObj.rotationY;
          var timeNew = new Date().getTime();
          if ((timeNew - main2.testTimer) > 750) {
            if (face > 0.40) {
              main2.turnedLeftCounter++;
              if (main2.turnedLeftCounter > 1) {
                main2.passed.test = 2;
                main2.passed.value = true;
                main2.testTimer = Date.now();
              }
            } else if (face < -0.40) {
              main2.faceOtherWayCounter++;
              if (main2.faceOtherWayCounter > 2){
                main2.livTries++;
                main2.doingLiveness = false;
              if (main2.livTries > main2.MAX_TRIES) {
                io.to(main2.socketID).emit('stopRecording', 0);
                io.to(main2.socketID).emit('completeLiveness', 0);
                main2.doingLiveness = false;
                var obj = {
                  sessionId: main2.sessionId,
                  type: main2.type,
                  livenessOutcome: "failed"
                };
                main.emit('result', obj);
              } else {
                io.to(main2.socketID).emit('completeLiveness', 1.5);
                main2.testIndex += 1;
                if (main2.testIndex > 4) {
                  main2.testIndex = 0;
                }
                main2.currTest = main2.tests[main2.testIndex];
                setTimeout(function() {
                  io.to(main2.socketID).emit('reTest', main2.currTest);
                  main2.testTimer = Date.now();
                  setTimeout(() => {
                    main2.doingLiveness = true;
                  },300);
                }, 2600);
              }
              main2.faceOtherWayCounter = 0;
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
          if ((timeNew - main2.testTimer) > 650) {
            if (smileFactor > 0.55) {
              main2.smileCounter++;
              if (main2.smileCounter > 1) {
                main2.passed.test = 3;
                main2.passed.value = true;
                main2.testTimer = Date.now();
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
          if ((timeNew - main2.testTimer) > 650) {
            if (yawnFactor > 0.3) {
              main2.yawnCounter++;
              if (main2.yawnCounter > 1) {
                main2.passed.test = 4;
                main2.passed.value = true;
                main2.testTimer = Date.now();
              }
            }
          }
          break;
        default:
      }
    }

    //switched to the respective api call
    main2.handleClientRequest = function (options) {
      var type = options.biometricType + options.action;
      switch (type) {
        case "voiceVerification":
        var uid = uuid();
          fs.appendFileSync(rootAbsPath + "/tempAssets/audio"+uid+".wav", new Buffer.alloc(options.recording.length, options.recording));
          myVoiceIt.voiceVerification({
            userId: main2.userID,
            contentLanguage: config2.contentLanguage,
            audioFilePath: rootAbsPath + "/tempAssets/audio"+uid+".wav",
            phrase: config2.phrase
          }, (jsonResponse) => {
            var obj = {
              sessionId: main2.sessionId,
              response: jsonResponse,
              type: type
            };
            main.emit('result', obj);
            io.to(main2.socketID).emit('requestResponse', obj);
            main2.removeFiles();
          });
          break;
        case "voiceEnrollment":
          fs.appendFileSync(rootAbsPath + "/tempAssets/audio"+uid+".wav", new Buffer.alloc(options.recording.length, options.recording));
          myVoiceIt.createVoiceEnrollment({
            userId: main2.userID,
            contentLanguage: config2.contentLanguage,
            audioFilePath: rootAbsPath + "/tempAssets/audio"+uid+".wav",
            phrase: config2.phrase
          }, (jsonResponse) => {
            var obj = {
              sessionId: main2.sessionId,
              response: jsonResponse,
              type: type
            };
            main.emit('result', obj);
            io.to(main2.socketID).emit('requestResponse', obj);
            main2.removeFiles();
          });
          break;
        case "faceEnrollment":
          fs.appendFileSync(rootAbsPath + "/tempAssets/video"+uid+".mp4", new Buffer.alloc(options.recording.length, options.recording));
          myVoiceIt.createFaceEnrollment({
            userId: main2.userID,
            videoFilePath: rootAbsPath + "/tempAssets/video"+uid+".mp4"
          }, (jsonResponse) => {
            var obj = {
              sessionId: main2.sessionId,
              response: jsonResponse,
              type: type
            };
            main.emit('result', obj);
            io.to(main2.socketID).emit('requestResponse', obj);
            main2.removeFiles();
          });
          break;
        case "faceVerification":
          fs.appendFileSync(rootAbsPath + "/tempAssets/video"+uid+".mp4", new Buffer.alloc(options.recording.length, options.recording));
          myVoiceIt.faceVerification({
            userId: main2.userID,
            contentLanguage: config2.contentLanguage,
            videoFilePath: rootAbsPath + "/tempAssets/video"+uid+".mp4"
          }, (jsonResponse) => {
            var obj = {
              sessionId: main2.sessionId,
              response: jsonResponse,
              type: type
            };
            main.emit('result', obj);
            io.to(main2.socketID).emit('requestResponse', obj);
            main2.removeFiles();
          });
          break;
        case "videoEnrollment":
          var recording = options.recording;
          fs.appendFileSync(rootAbsPath + "/tempAssets/video"+uid+".mov", new Buffer.alloc(recording.length, recording));
          myVoiceIt.createVideoEnrollment({
            userId: main2.userID,
            contentLanguage: config2.contentLanguage,
            videoFilePath: rootAbsPath + "/tempAssets/video"+uid+".mov",
            phrase: config2.phrase
          }, (jsonResponse) => {
            var obj = {
              sessionId: main2.sessionId,
              response: jsonResponse,
              type: type
            };
            main.emit('result', obj);
            io.to(main2.socketID).emit('requestResponse', obj);
            main2.removeFiles();
          });
          break;
        case "videoVerification":
          options.recording = options.recording;
          fs.appendFileSync(rootAbsPath + "/tempAssets/video"+uid+".mov", new Buffer.alloc(options.recording.length, options.recording));
          myVoiceIt.videoVerification({
            userId: main2.userID,
            contentLanguage: config2.contentLanguage,
            videoFilePath: rootAbsPath + "/tempAssets/video"+uid+".mov",
            phrase: config2.phrase
          }, (jsonResponse) => {
            var obj = {
              sessionId: main2.sessionId,
              response: jsonResponse,
              type: type
            };
            main.emit('result', obj);
            io.to(main2.socketID).emit('requestResponse', obj);
            main2.removeFiles();
          });
          break;
        case "deleteEnrollments":
          myVoiceIt.deleteAllEnrollmentsForUser({
            userId: main2.userID,
          }, (jsonResponse) => {
            var obj = {
              sessionId: main2.sessionId,
              response: jsonResponse,
              type: type
            };
            main.emit('result', obj);
            io.to(main2.socketID).emit('requestResponse', obj);
          });
          break;
        default:
      }
    };

    //takes the picture upon liveness completion and makes liveness-related API calls
    main2.handleFaceLivenessCompletion = function(data) {
      var uid = uuid();
      //convert milliseconds stamps to in-video time
      main2.stampToVidSeconds(main2.successTimeStamps, main2.timeStamps);
      fs.appendFileSync(rootAbsPath + "/tempAssets/vid"+uid+".mp4", new Buffer.alloc(data.recording.length, data.recording));
      var reducedStamps = [];
      //round off to 2 significant figures
      for (var j = 0; j < 1; j++) {
        reducedStamps[j] = Math.round(main2.successTimeStamps[j] * 10) / 10;
      }
      //take snapshots
      var proc = new ffmpeg(rootAbsPath + '/tempAssets/vid'+uid+'.mp4')
        .on('end', function(stdout, stderr) {
          main2.doLivenessFaceCalls(data.recording, uid);
        }).takeScreenshots({
          count: 1,
          filename: 'pic'+uid+'.png',
          timemarks: reducedStamps
        }, rootAbsPath + '/tempAssets', function(err) {
          console.log(err);
        });
    }

    main2.handleVidLivenessCompletion = function (data) {
      if (data.kind == "face") {
        main2.livFaceRecord = data.recording;
      } else {
        var uid = uuid();
        //convert milliseconds stamps to in-video time
        main2.stampToVidSeconds(main2.successTimeStamps, main2.timeStamps);
        fs.appendFileSync(rootAbsPath + "/tempAssets/vid"+uid+".mp4", new Buffer.alloc(main2.livFaceRecord.length, main2.livFaceRecord));
        //round off to 2 significant figures
        var reducedStamps = [];
        //only one Faceshot for videoLiveness
        for (var j = 0; j < 1; j++) {
          reducedStamps[j] = Math.round(main2.successTimeStamps[j] * 10) / 10;
        }
        var proc = new ffmpeg(rootAbsPath + '/tempAssets/vid'+uid+'.mp4')
          .on('end', function(stdout, stderr) {
            //get the audio
            fs.appendFileSync(rootAbsPath + "/tempAssets/vid2"+uid+".mp4", new Buffer.alloc(data.recording.length, data.recording));
            ffmpeg(rootAbsPath + "/tempAssets/vid2"+uid+".mp4")
              .output(rootAbsPath + "/tempAssets/audio"+uid+".wav")
              .on('end', function() {
                //make the vid verification call
                myVoiceIt.videoVerificationLiv({
                  userId: main2.userID,
                  contentLanguage: config2.contentLanguage,
                  photoFilePath: rootAbsPath + "/tempAssets/pic"+uid+".png", //from liveness
                  audioFilePath: rootAbsPath + "/tempAssets/audio"+uid+".wav" //audio
                }, (jsonResponse) => {
                  if (jsonResponse.responseCode == "SUCC") {
                    var obj = {
                      sessionId: main2.sessionId,
                      type: main2.type,
                      livenessOutcome: "passed"
                    };
                    main.emit('result', obj);
                    io.to(main2.socketID).emit('completeLiveness', 3);
                  } else {
                    var obj = {
                      sessionId: main2.sessionId,
                      type: main2.type,
                      livenessOutcome: "failed"
                    };
                    main.emit('result', obj);
                    io.to(main2.socketID).emit('completeLiveness', 2);
                  }
                  main2.removeFiles();
                });
              }).on('error', function(e) {
                console.log('error: ', e.code, e.msg);
              }).run();
          }).takeScreenshots({
            count: 1,
            filename: 'pic'+uid+'.png',
            timemarks: reducedStamps //number of seconds
          }, rootAbsPath + '/tempAssets', function(err) {
            console.log(err);
          });
      }
    }

    main2.doLivenessFaceCalls = function (data, uid) {
      var responses = 2;
      var passes = 0;
      var fails = 0;
      var curr = 0;
      var emitted = false;
      for (var i = 1; i <= 1; i++) {
        myVoiceIt.faceVerificationLiv({
          userId: main2.userID,
          contentLanguage: config2.contentLanguage,
          photo: rootAbsPath + "/tempAssets/pic"+uid+".png"
        }, (jsonResponse) => {
          curr++;
          console.log(jsonResponse);
          var obj = {
            response: jsonResponse,
            type: main2.type
          };
          if (jsonResponse.responseCode == "SUCC") {
            passes++;
            if (passes >= 1) {
              if (!emitted) {
                io.to(main2.socketID).emit('completeLiveness', 3);
                emitted = true;
              }
              var obj = {
                sessionId: main2.sessionId,
                type: main2.type,
                livenessOutcome: "passed"
              };
              main.emit('result', obj);
            }
          } else {
            fails++;
            if (fails >= 1) {
              io.to(main2.socketID).emit('completeLiveness', 2);
            }
            var obj = {
              sessionId: main2.sessionId,
              type: main2.type,
              livenessOutcome: "failed"
            };
            main.emit('result', obj);
          }
          main2.removeFiles(responses);
        });
      }
    }

    main2.removeFiles = function (num) {
      fs.readdir(rootAbsPath +'/tempAssets', (err, files) => {
        if (err) throw err;
          for (const file of files) {
            if (file !== 'readMe.txt'){
              fs.unlink(path.join(rootAbsPath+'/tempAssets', file), err => {
                if (err) throw err;
              });
          }
        }
      });
    }

    main2.resetAll = function (data) {
      main2.tests = main2.shuffle(main2.tests);
      main2.testTimer = Date.now();
      main2.testIndex = 0;
      main2.currTest = main2.tests[main2.testIndex];
      main2.oldTst = main2.currTest;
      main2.passed = {
        test: -1,
        value: false
      };
      main2.passedTests = 0;
      main2.timeStamps = [];
      main2.successTimeStamps = [];
      main2.currTime = 0;
      main2.type = data.type;
      main2.livTries = 0;
      main2.doingLiveness = true;
      main2.checkForFaceStraight = false;
      main2.verificationTries = 0;
      main2.livFaceRecord = 0;
      main2.livVoiceRecord = 0;
      main2.timePassed = 0;
      main2.resetCounters();
      main2.passedAll = false;
    }

    //Handle client-server communication
      io.sockets.connected[main2.socketID].on('requestAllEnrollmentDetails', function(request) {
        myVoiceIt.getAllEnrollmentsForUser({
          userId: main2.userID
        }, (jsonResponse) => {
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
          io.to(main2.socketID).emit('allEnrollmentNeeded', obj);
        });
      });

      io.sockets.connected[main2.socketID].on('requestFaceEnrollmentDetails', function(request) {
        myVoiceIt.getFaceEnrollmentsForUser({
          userId: main2.userID
        }, (jsonResponse) => {
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
          io.to(main2.socketID).emit('faceEnrollmentNeeded', obj);
        });
      });

      //initiate lvieness event from cleint
      io.sockets.connected[main2.socketID].on('initiate', function(data) {
        main2.resetAll(data);
        main2.initTimeStamps();
        io.to(main2.socketID).emit('initiated', main2.currTest);
      });

      //date event from client
      io.sockets.connected[main2.socketID].on('data', function(faceObject) {
        if (main2.doingLiveness) {
          main2.currTime = Date.now();
          //liveness test timed out
          if ((main2.currTime - main2.testTimer) > 3500) {
            main2.livTries++;
            if (main2.livTries > main2.MAX_TRIES) {
              io.to(main2.socketID).emit('stopRecording', 0);
              io.to(main2.socketID).emit('completeLiveness', 0);
              main2.doingLiveness = false;
              var obj = {
                sessionId: main2.sessionId,
                type: main2.type,
                livenessOutcome: "failed"
              };
              main.emit('result', obj);
            } else {
              main2.doingLiveness = false;
              io.to(main2.socketID).emit('completeLiveness', 1);
              main2.testIndex += 1;
              if (main2.testIndex > 4) {
                main2.testIndex = 0;
              }
              main2.currTest = main2.tests[main2.testIndex];
              setTimeout(function() {
                io.to(main2.socketID).emit('reTest', main2.currTest);
                main2.testTimer = Date.now();
                setTimeout(() => {
                  main2.doingLiveness = true;
                },300);
              }, 2000);
            }
          }
          var face = faceObject;
          if (main2.passedTests < main2.numTests){
            main2.doLiveness(main2.currTest, face);
          }
          if (main2.passed.value) {
            main2.passedTests++;
            main2.testIndex += 1;
            if (main2.testIndex > 4) {
              main2.testIndex = 0;
            }
            main2.oldTest = main2.currTest;
            main2.currTest = main2.tests[main2.testIndex];
            if (main2.passedTests < main2.numTests) {
              io.to(main2.socketID).emit('test', main2.currTest);
              if (main2.oldTest < 3) {
                main2.timePassed = Date.now();
                main2.checkForFaceStraight = true;
              } else if (main2.oldTest >= 3) {
                main2.checkForFaceStraight = false;
                if (main2.successTimeStamps.length < main2.numTests) {
                  main2.successTimeStamps.push(main2.timeStamps[main2.timeStamps.length - 1]);
                }
              }
              main2.resetCounters();
            } else {
              main2.passedAll = true;
              if (main2.type == "face") {
                io.to(main2.socketID).emit('completeLiveness', 4);
              } else {
                io.to(main2.socketID).emit('completeLiveness', 6);
              }
              var timeOut = 500;
              if (main2.oldTest < 3) {
                if (main2.successTimeStamps.length < main2.numTests) {
                  main2.successTimeStamps.push(main2.timeStamps[main2.timeStamps.length - 1]+400);
                }
                io.to(main2.socketID).emit('completeLiveness', 7);
                timeOut = 800;
              } else if (main2.oldTest >= 3) {
                if (main2.successTimeStamps.length < main2.numTests) {
                  main2.successTimeStamps.push(main2.timeStamps[main2.timeStamps.length - 1]);
                }
              }
              setTimeout(()=>{
                io.to(main2.socketID).emit('stopRecording', 1);
                if (main2.type == "video") {
                    setTimeout(function() {
                      io.to(main2.socketID).emit('completeLiveness', 5);
                    }, 100);
                  }
              },timeOut);
              main2.doingLiveness = false;
            }
            main2.passed.value = false;
          }
          //wait for face back
          if (main2.checkForFaceStraight) {
            var a = Date.now();
            if ((face.rotationY < 0.2 && face.rotationY > -0.2 && face.rotationX < 0.20) || (a - main2.timePassed > 1000)) {
              main2.testTimer = Date.now();
              if (main2.successTimeStamps.length < main2.numTests) {
                main2.successTimeStamps.push(main2.timeStamps[main2.timeStamps.length - 1]);
              }
              main2.resetCounters();
              main2.checkForFaceStraight = false;
            }
          }
        }
      });

      //Api request from client
      io.sockets.connected[main2.socketID].on('apiRequest', function(options) {
        main2.handleClientRequest(options);
      });

      //recorded data from client
      io.sockets.connected[main2.socketID].on('recording', function(data) {
        if (main2.passedAll){
          if (data.kind !== "voice") {
            clearInterval(main2.timeStampId);
          }
          if (main2.type == "face") {
            main2.handleFaceLivenessCompletion(data);
          } else if (main2.type == "video" && data.kind == "face") {
            main2.handleVidLivenessCompletion(data);
          } else if (main2.type == "video" && data.kind == "voice") {
            main2.handleVidLivenessCompletion(data);
          }
        }
      });

      //timestamps of the recording
      io.sockets.connected[main2.socketID].on('timestamp', function(c) {
        main2.initTimeStamps();
      });

      io.sockets.connected[main2.socketID].on('terminateVoiceItObj', function() {
        main2.doingLiveness = false;
      });
    }
}
util.inherits(voiceItModule, EventEmitter);
module.exports = voiceItModule;
