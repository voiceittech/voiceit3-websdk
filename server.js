let voiceit2 = require('voiceit2-nodejs');
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
var testNum;
var currTest;
var time;
var testIndex = 0;
var passed = false;
var oldTest = -1;
var passedTests = 0;
var oldVertices = [];
var time = new Date().getTime();
var face;
var timeStampId;
var timeStamps = [];
var successTimeStamps = [];

//counters
var turnedRightCounter = 0;
var turnedLeftCounter = 0;
var yawnCounter = 0;
var smileCounter = 0;
var facedDownCounter = 0;

//start timestamps for video
function initTimeStamps(){
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
    timeStamps[i] = (allTimestamps[allTimestamps.length-1] - timeStamps[i])/1000;
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
      if ((timeNew - time) > 500){
        if (face >= 0.25) {
          console.log("You faced down");
          facedDownCounter++;
          if(facedDownCounter > 1){
            passed = true;
            }
        }
      }
      break;
      case 1:
      var face = a.rotationY;
      var timeNew = new Date().getTime();
      if ((timeNew - time) > 500){
      if (face < -0.4) {
        console.log("you turned right!");
        turnedRightCounter++;
        if(turnedRightCounter > 1){
          passed = true;
          }
        }
      }
      break;
      case 2:
      var face = a.rotationY;
      var timeNew = new Date().getTime();
      if ((timeNew - time) > 500){
      if (face > 0.4) {
          console.log("you turned left!");
          turnedLeftCounter++;
          if(turnedLeftCounter > 1){
            passed = true;
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
      if ((timeNew - time) > 500){
      if(smileFactor > 0.50){
        console.log("You smiled!");
        smileCounter++;
        if(smileCounter > 1){
          time = new Date().getTime();
          passed = true;
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
      if ((timeNew - time) > 500){
      if (yawnFactor > 0.25){
        console.log("you yawned!");
        yawnCounter++;
        if(yawnCounter > 1){
          time = new Date().getTime();
          passed = true;
          }
      }
      }
      break;
      //blink detection is really bad because laptop webcams are so far away

      // case 5:
      //   if((v[0] > 12 && (v[1] > 0.4 || v[2] > 0.4))) {
      //   		console.log("you blinked!");
      //       passed = true;

      //   	}
      //   	storeVertices(v);
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
function handleLivenessCompletion(recording){
    clearInterval(timeStampId);
    stampToVidSeconds(successTimeStamps,timeStamps);
    fs.appendFileSync("vid.mov", new Buffer.alloc(recording.length,recording));
    var proc = new ffmpeg('vid.mov')
    .on('end', function(stdout, stderr) {
        fs.unlink('vid.mov', (err) => {
        if (err) throw err;
         });
        fs.unlink('./test_1.png', (err) => {
        if (err) throw err;
        });
        fs.unlink('./test_2.png', (err) => {
          if (err) throw err;
        });
        fs.unlink('./test_3.png', (err) => {
          if (err) throw err;
        });
      }).takeScreenshots({
      count: 3,
      filename:'test.png',
      timemarks: successTimeStamps //number of seconds
      }, './', function(err) {
      });
  }


//Handle client-server communication
io.on('connection', function(socket){
  //initiate lvieness event from cleint
  socket.on('initiate', function(count){
    tests = shuffle(tests);
    testNum = count;
    currTest = tests[testIndex];
    socket.emit('initiated', currTest);
  });

  //date event from client
  socket.on('data', function(faceObject) {
    face = faceObject;
    if (oldTest != currTest){
      console.log("testing for: " + currTest);
      oldTest = currTest;
    }
    doLiveness(currTest,face);
    if (passed){
      if (currTest !== 4 && currTest !== 3){
        successTimeStamps.push(timeStamps[timeStamps.length-1]);
      } else {
        //add delay for right, left, face-down
        successTimeStamps.push(timeStamps[timeStamps.length-1]+1);
      }
      passedTests++;
      passed = false;
      resetCounters();
      testIndex += 1;
      time = new Date().getTime();
      //debugging only
      if (testIndex > 4){
      testIndex = 0;
      }
      currTest = tests[testIndex];
      socket.emit('test', currTest);
    }
  });

  //Api request from client
  socket.on('apiRequest', function(options){
    console.log(options);
    handleClientRequest(options);
  });

  //recorded data from client
  socket.on('recording', function(recording){
    handleLivenessCompletion(recording);
  });

  //timestamps of the recording
  socket.on('timestamp',function(c){
    initTimeStamps();
  });
});

http.listen(8000, function() {
  console.log('Listening on *:8000');
});
