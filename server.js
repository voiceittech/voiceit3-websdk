let voiceit2 = require('./js/voiceit-client');
let config = require('./config.js');
let myVoiceIt = new voiceit2(config.API_KEY, config.API_TOKEN);
let fs = require('fs');
var faceLib = require('./faceLib');
var express = require('express');
app = express();
app.use(express.static('public'));
var http = require('http').Server(app);
var io = require('socket.io')(http);
var ffmpeg = require('fluent-ffmpeg');

//test stuff
var tests = [0,1,2,3,4];
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
var numTests;
var testTimer;
var currTime;
var type;
var livTries = 0;
const MAX_TRIES = 2;
var doingLiveness = false;
var checkForFaceStraight = false;
var verificationTries = 0;
const MAX_LIV_VER_TRIES = 2;
var livFaceRecord;
var livVoiceRecord;


//counters
var turnedRightCounter = 0;
var turnedLeftCounter = 0;
var yawnCounter = 0;
var smileCounter = 0;
var facedDownCounter = 0;

//start timestamps for video
function initTimeStamps(){
  timeStamps = [];
  console.log('timestamps started');
    timeStampId = setInterval(function(){
    var time = Date.now();
    timeStamps.push(time);
  },50);
}

//helper to convert a point to a vector
function Point(x,y){
 this.x = x;
 this.y = y;

 this.distanceTo = function (point)
 {
     var distance = Math.sqrt((Math.pow(point.x-this.x,2))+(Math.pow(point.y-this.y,2)))
     return distance;
 };
}

function stampToVidSeconds(timeStamps, allTimestamps){
  for (var i = 0; i < successTimeStamps.length; i++){
    timeStamps[i] = (timeStamps[i] - allTimestamps[0])/1000;
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
    for(var i = 0, l = vertices.length; i < l; i++) {
    oldVertices[i] = vertices[i];
  }
}

//reset test counters
function resetCounters(){
  turnedRightCounter = -1;
  turnedLeftCounter = -1;
  yawnCounter = -1;
  smileCounter = -1;
  facedDownCounter = -1;
}

//for a given test cass and face object, do liveness math
function doLiveness(cas, a){
    switch (cas){
      case 0:
      var face = a.rotationX;
      var timeNew = new Date().getTime();
      if ((timeNew - testTimer) > 700){
        if (face >= 0.25) {
          console.log("You faced down");
          facedDownCounter++;
          if(facedDownCounter > 1){
            passed.test = 0;
            passed.value = true;
            testTimer = Date.now();
          }
        } else if (a.rotationY < -0.40 || a.rotationY > 0.40){
            livTries++;
            if (livTries > MAX_TRIES){
          io.emit('stopRecording',1);
          io.emit('completeLiveness',0); 
          doingLiveness = false;    
          } else {
          doingLiveness = false;
          io.emit('completeLiveness',1);
          testIndex += 1;
          
          if (testIndex > 4){
          testIndex = 0;
          }
         currTest = tests[testIndex];
         setTimeout(function(){
            io.emit('test2', currTest);
           doingLiveness = true;
           testTimer = Date.now();
          },2000);
        }
      } 
      }
      break;
      case 1:
      var face = a.rotationY;
      var timeNew = new Date().getTime();
      if ((timeNew - testTimer) > 700){
      if (face < -0.40) {
        console.log("you turned right!");
        turnedRightCounter++;
        if(turnedRightCounter > 1){
          passed.test = 1;
          passed.value = true;
          testTimer = Date.now();
          }
        } else if (a.rotationY > 0.40){
            livTries++;
            if (livTries > MAX_TRIES){
          io.emit('completeLiveness',0); 
          doingLiveness = false;    
          } else {
          doingLiveness = false;
          io.emit('completeLiveness',1);
          testIndex += 1;
          
          if (testIndex > 4){
          testIndex = 0;
          }
         currTest = tests[testIndex];
         setTimeout(function(){
            io.emit('test2', currTest);
           doingLiveness = true;
           testTimer = Date.now();
          },2000);
        }
      } 
      }
      break;
      case 2:
      var face = a.rotationY;
      var timeNew = new Date().getTime();
      if ((timeNew - testTimer) > 700){
      if (face > 0.40) {
          console.log("you turned left!");
          turnedLeftCounter++;
          if(turnedLeftCounter > 1){
            passed.test = 2;
            passed.value = true;
            testTimer = Date.now();
            }
      } else if (a.rotationY < - 0.40){
            livTries++;
            if (livTries > MAX_TRIES){
          io.emit('completeLiveness',0); 
          doingLiveness = false;    
          } else {
          doingLiveness = false;
          io.emit('completeLiveness',1);
          testIndex += 1;
  
          if (testIndex > 4){
          testIndex = 0;
          }
         currTest = tests[testIndex];
         setTimeout(function(){
            io.emit('test2', currTest);
           doingLiveness = true;
           testTimer = Date.now();
          },2000);
        }
      }
      }
      break;
      case 3:
      var v = a.vertices;
      var p0 = new Point(v[48*2], v[48*2+1]); // mouth corner left
      var p1 = new Point(v[54*2], v[54*2 + 1]);   // mouth corner right

      var mouthWidth = p0.distanceTo(p1);

      p0 = new Point(v[39*2], v[39*2+1]); // mouth corner left
      p1 = new Point(v[42*2], v[42*2+1]);   // mouth corner right

      var eyeDist = p0.distanceTo(p1);

      var smileFactor = mouthWidth / eyeDist;

      smileFactor -= 1.40; // 1.40 - neutral, 1.70 smiling

      smileFactor *= 4.0;

      if(smileFactor < 0.0) { smileFactor = 0.0; }
      if(smileFactor > 1.0) { smileFactor = 1.0; }

      var timeNew = new Date().getTime();
      if ((timeNew - testTimer) > 700){
      if(smileFactor > 0.55){
        console.log("You smiled!");
        smileCounter++;
        if(smileCounter > 1){
          passed.test = 3;
          passed.value = true;
          testTimer = Date.now();
          }
      }
      }
      break;
      case 4:
      var v = a.vertices;
      var p0 = new Point(v[39*2], v[39*2+1]); // left eye inner corner
      var p1 = new Point(v[42*2], v[42*2+1]); // right eye outer corner

      var eyeDist = p0.distanceTo(p1);

      p0 = new Point(v[62*2], v[62*2+1]); // mouth upper inner lip
      p1 = new Point(v[66*2], v[66*2+1]); // mouth lower inner lip

      var mouthOpen = p0.distanceTo(p1);

      var yawnFactor = mouthOpen / eyeDist;

      yawnFactor -= 0.35; // remove smiling

      if(yawnFactor < 0) yawnFactor = 0;

      yawnFactor *= 2.0;


      if(yawnFactor < 0.0) { yawnFactor = 0.0; }
      if(yawnFactor > 1.0) { yawnFactor = 1.0; }

      var timeNew = new Date().getTime();
      if ((timeNew - testTimer) > 500){
      if (yawnFactor > 0.4){
        console.log("you yawned!");
        yawnCounter++;
        if(yawnCounter > 1){
          time = new Date().getTime();
          passed.test = 4;
          passed.value = true;
          testTimer = Date.now();
          }
      }
      }
      break;
      //blink detection is really bad because laptop webcams are so far away

      // case 5:
      //   if((v[0] > 12 && (v[1] > 0.59 || v[2] > 0.59))) {
      //      console.log("you blinked!");
      //       passed = true;

      //    }
      //    storeVertices(v);
      default:
    }
  }

//switched to the respective api call
function handleClientRequest(options) {
    var type = options.biometricType + options.action;
    switch (type){
      case "voiceVerification":
      fs.appendFileSync("audio.wav", new Buffer.alloc(options.recording.length,options.recording));
      myVoiceIt.voiceVerification({
        userId: config.userId,
        contentLanguage : config.contentLanguage,
        audioFilePath : "audio.wav",
        phrase: config.phrase
      },(jsonResponse)=>{
        var obj = {response: jsonResponse,
           type: type };
        console.log(jsonResponse);
        io.emit('requestResponse', obj);
          fs.unlink('audio.wav', (err) => {
          if (err) throw err;
           });
        });
      break;
      case "voiceEnrollment":
      console.log(config.phrase);
      fs.appendFileSync("audio.wav", new Buffer.alloc(options.recording.length,options.recording));
      myVoiceIt.createVoiceEnrollment({
        userId: config.userId,
        contentLanguage : config.contentLanguage,
        audioFilePath : "audio.wav",
        phrase: config.phrase
      },(jsonResponse)=>{
        var obj = {response: jsonResponse,
           type: type };
        console.log(jsonResponse);
        io.emit('requestResponse', obj);
          fs.unlink('audio.wav', (err) => {
          if (err) throw err;
           });
        });
        break;
        case "faceEnrollment":
        fs.appendFileSync("video.mp4", new Buffer.alloc(options.recording.length,options.recording));
        myVoiceIt.createFaceEnrollment({
          userId: config.userId,
          videoFilePath : "video.mp4"
        },(jsonResponse)=>{
          var obj = {response: jsonResponse,
             type: type };
          console.log(jsonResponse);
          io.emit('requestResponse', obj);
            fs.unlink('video.mp4', (err) => {
            if (err) throw err;
             });
          });
        break;
        case "faceVerification":
        fs.appendFileSync("video.mp4", new Buffer.alloc(options.recording.length,options.recording));
        myVoiceIt.faceVerification({
          userId: config.userId,
          contentLanguage : config.contentLanguage,
          videoFilePath: "video.mp4"
        },(jsonResponse)=>{
          var obj = {response: jsonResponse,
             type: type };
          console.log(jsonResponse);
          io.emit('requestResponse', obj);
            fs.unlink('video.mp4', (err) => {
            if (err) throw err;
             });
          });
        break;
        case "videoEnrollment":
        var recording = options.recording.video;
        console.log(recording);
        fs.appendFileSync("video.mov", new Buffer.alloc(recording.length,recording));
        myVoiceIt.createVideoEnrollment({
          userId: config.userId,
          contentLanguage : config.contentLanguage,
          videoFilePath : "video.mov",
          phrase: config.phrase
        },(jsonResponse)=>{
          var obj = {response: jsonResponse,
             type: type };
          console.log(jsonResponse);
          io.emit('requestResponse', obj);
            fs.unlink('video.mov', (err) => {
            if (err) throw err;
             });
          });
        break;
        case "videoVerification":
        options.recording = options.recording.video;
        fs.appendFileSync("video.mov", new Buffer.alloc(options.recording.length,options.recording));
        myVoiceIt.videoVerification({
          userId: config.userId,
          contentLanguage : config.contentLanguage,
          videoFilePath : "video.mov",
          phrase: config.phrase
        },(jsonResponse)=>{
          var obj = {response: jsonResponse,
             type: type };
          console.log(jsonResponse);
          io.emit('requestResponse', obj);
            fs.unlink('video.mov', (err) => {
            if (err) throw err;
             });
          });
        break;
        case "deleteEnrollments":
        myVoiceIt.deleteAllEnrollmentsForUser({
          userId: config.userId,
        },(jsonResponse)=>{
          console.log(jsonResponse);
          var obj = {response: jsonResponse,
             type: type };
          io.emit('requestResponse', obj);
          });
        break;
        case "getPhrases":
        myVoiceIt.getPhrases({
          lang: config.contentLanguage,
        },(jsonResponse)=>{
          console.log(jsonResponse);
          var obj = {response: jsonResponse,
             type: type };
          io.emit('requestResponse', obj);
          });
        break;
        default:
      }
  };

//takes the picture upon liveness completion and makes liveness-related API calls
function handleFaceLivenessCompletion(data){
    stampToVidSeconds(successTimeStamps,timeStamps);
    console.log(successTimeStamps);
    if (type == "face"){
          fs.appendFileSync("vid.mov", new Buffer.alloc(data.recording.length,data.recording));
    } else {
    fs.appendFileSync("vid.mov", new Buffer.alloc(livFaceRecord.length,livFaceRecord));
  }

    var proc = new ffmpeg('vid.mov')
    .on('end', function(stdout, stderr) {
         if (type == "face"){
      doLivenessFaceCalls(data.recording);
        } else {
      doLivenessFaceCalls(data);
        }
      }).takeScreenshots({
      count: numTests+2,
      filename:'pic.png',
      timemarks: successTimeStamps //number of seconds
      }, './', function(err) {
      });
  }

  function handleVidLivenessCompletion(data){
    if (data.kind == "face"){
      livFaceRecord = data.recording;
      console.log("face data received");
    } else if (data.kind == "voice"){
      handleFaceLivenessCompletion(data);
    }

  }

  function doLivenessFaceCalls(data){
    var responses = successTimeStamps.length;
    var passes = 0;
    var fails = 0;
    var curr;
    for (var i = 1; i <= successTimeStamps.length; i++){
      myVoiceIt.faceVerificationLiv({
        userId: config.userId,
        contentLanguage : config.contentLanguage,
        photo: "pic_"+i+".png"
      },(jsonResponse) => {
        curr++
        console.log(jsonResponse);
        var obj = {response: jsonResponse,
           type: type };
        if (jsonResponse.responseCode == "SUCC"){
          passes++;
            if (passes >= successTimeStamps.length/2){
                  if (data.kind == "face"){
                  io.emit('completeLiveness', 3);
                } else  {
                  doLivenessVidCalls(data.recording);
                }
           }
        } else {
          fails++;
          if (fails >= successTimeStamps.length/2){
              io.emit('completeLiveness', 2);
          }
        }
        if (curr >= responses){
            removeFiles(responses);
        }
        });
        }
  }

  function doLivenessVidCalls(recording){
      fs.appendFileSync("vid2.mp4", new Buffer.alloc(recording.length,recording));
        ffmpeg("vid2.mp4")
        .output("audio.wav")
        .on('end', function() {                    
            
          myVoiceIt.voiceVerification({
        userId: config.userId,
        contentLanguage : config.contentLanguage,
        audioFilePath : "audio.wav",
        phrase: config.phrase
        },(jsonResponse)=>{
        console.log(jsonResponse);
        var obj = {response: jsonResponse,
           type: type };
        if (jsonResponse.responseCode == "SUCC"){
          io.emit("completeLiveness",3);
        } else {
          io.emit("completeLiveness",2);
        }
          fs.unlink('vid2.mp4', (err) => {
          if (err) throw err;
           });
          fs.unlink('audio.wav', (err) => {
          if (err) throw err;
           });
        });

        }).on('error', function(e){
            console.log('error: ', e.code, e.msg);
        }).run();


  }

  function removeFiles(num){
    for (var i = 1; i <= num; i++){
    fs.unlink("./pic_"+i+".png", (err) => {
      if (err) throw err;
      });
    }
    fs.unlink("./vid.mov", (err) => {
      if (err) throw err;
     });
  }


//Handle client-server communication
io.on('connection', function(socket){
  //initiate lvieness event from cleint
  socket.on('initiate', function(data){
    livTries  = 0;
    type = data.type;
    testTimer = Date.now();
    passedTests = 0;
    tests = shuffle(tests);
    numTests = config.numLivTests;
    currTest = tests[testIndex];
    successTimeStamps = [];
    doingLiveness = true;
    io.emit('initiated', currTest);
  });

  //date event from client
  socket.on('data', function(faceObject) {
    if (doingLiveness){
    currTime = Date.now();
    //liveness test timed out
    if ((currTime - testTimer) > 3000){
      livTries++;
      if (livTries > MAX_TRIES){
      socket.emit('completeLiveness',0); 
      doingLiveness = false;    
      } else {
      doingLiveness = false;
      socket.emit('completeLiveness',1);
      testIndex += 1;
      
      if (testIndex > 4){
      testIndex = 0;
      }
      currTest = tests[testIndex];
      setTimeout(function(){
        socket.emit('test2', currTest);
        doingLiveness = true;
        testTimer = Date.now();
      },2000);
      }
    }
    face = faceObject;
    if (oldTest != currTest){
      console.log("testing for: " + currTest);
      oldTest = currTest;
    }
    doLiveness(currTest,face);
    if (passed.value && !checkForFaceStraight){
      testIndex += 1;
      if (testIndex > 4){
      testIndex = 0;
      }
      currTest = tests[testIndex];
      socket.emit('test', currTest);
      if (currTest < 3){
        checkForFaceStraight = true;
      } else if (currTest >= 3){
        if (successTimeStamps.length < numTests){
        successTimeStamps.push(timeStamps[timeStamps.length-1]);
        }
      passedTests++;
      if (passedTests >= numTests){
        successTimeStamps[successTimeStamps.length-1] = successTimeStamps[successTimeStamps.length-1] - 100;
        console.log("stop recordingg");
        passed.value = false;
        doingLiveness = false;
        io.emit('stopRecording',1);
        if (type == "video"){
          setTimeout(function(){
          io.emit('completeLiveness',5);
          },100);
        } else {
          io.emit('completeLiveness',4);
        } 
      } else {
      passed.value = false;
      resetCounters();
      testTimer = new Date().getTime();
    }
    }
    }
    //wait for face back 
    if (face.rotationY < 0.2 && face.rotationY > -0.2 && checkForFaceStraight){
        if (successTimeStamps.length < numTests){
        successTimeStamps.push(timeStamps[timeStamps.length-1]);
        }
        passedTests++
        if (passedTests >= numTests){
          console.log("stop recordingg");
        passed.value = false;
        doingLiveness = false;
        io.emit('stopRecording',1);
        if (type == "video"){
          console.log("continuing liveness");
          setTimeout(function(){
          io.emit('completeLiveness',5);
          },100);
        } else {
          io.emit('completeLiveness',4);
        }
      } else {
      passed.value = false;
      resetCounters();
      testTimer = new Date().getTime();
    }
      checkForFaceStraight = false;
      }
  }
  });

  //Api request from client
  socket.on('apiRequest', function(options){
    console.log(options);
    handleClientRequest(options);
  });

  //recorded data from client
  socket.on('recording', function(data){
    data.recording = data.recording.video;
    if (data.kind !== "voice"){
    clearInterval(timeStampId);
    }
    console.log(data.recording);
      if (type == "face"){
          handleFaceLivenessCompletion(data);
      } else if (type == "video") {
         handleVidLivenessCompletion(data);
    }
  });

  //timestamps of the recording
  socket.on('timestamp',function(c){
    initTimeStamps();
  });
});

http.listen(8000, function() {
  console.log('Listening on *:8000');
});
