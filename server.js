let voiceit2 = require('voiceit2-nodejs');
let credentials = require('./credentials');
let myVoiceIt = new voiceit2(credentials.API_KEY, credentials.API_TOKEN);
let fs = require('fs');
var faceLib = require('./faceLib');
var express = require('express');
app = express();
app.use(express.static('public'));
var http = require('http').Server(app);
var io = require('socket.io')(http);

//test stuff
var tests = [0,1,2,3,4];
var testNum;
var currTest;
var testIndex = 0;
var passed = false;
var oldTest = -1;
var passedTests = 0;
var oldVertices = [];
var time = new Date().getTime();
var face;

//counters
var turnedRightCounter = 0;
var turnedLeftCounter = 0;
var yawnCounter = 0;
var smileCounter = 0;
var facedDownCounter = 0;

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

      if(smileFactor > 0.25) smileFactor = 0.25;
      if(smileFactor < 0.00) smileFactor = 0.00;

      smileFactor *= 4.0;

      if(smileFactor < 0.0) { smileFactor = 0.0; }
      if(smileFactor > 1.0) { smileFactor = 1.0; }

      var timeNew = new Date().getTime();
      if ((timeNew - time) > 500){
      if(smileFactor > 0.50){
        console.log("You smiled!");
        smileCounter++;
        if(smileCounter > 1){
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

      if(yawnFactor > 1.0) yawnFactor = 1.0;

      if(yawnFactor < 0.0) { yawnFactor = 0.0; }
      if(yawnFactor > 1.0) { yawnFactor = 1.0; }

      var timeNew = new Date().getTime();
      if ((timeNew - time) > 500){
      if (yawnFactor > 0.25){
        console.log("you yawned!");
        yawnCounter++;
        if(yawnCounter > 1){
          passed = true;
          }
      }
      }
      break;
      case 5:
        if((v[0] > 12 && (v[1] > 0.4 || v[2] > 0.4))) {
        		console.log("you blinked!");
            passed = true;
        	}
        	storeVertices(v);
      default:
    }
  }

//switched to the respective api call
function handleClientRequest (type, contentLanguage, recording, phrase) {
    type = type[0]+type[1];
    var response;
    switch (type){
      case "voiceVerification":
      console.log(phrase);
      fs.appendFileSync("audio.wav", new Buffer.alloc(recording.length,recording));
      myVoiceIt.voiceVerification({
        userId: "usr_9d2bffcd2540450f9c9e75f393ebe876",
        contentLanguage : "en-US",
        audioFilePath : "audio.wav",
        phrase: phrase
      },(jsonResponse)=>{
        var array = [jsonResponse, type];
        console.log(jsonResponse);
        io.emit('requestResponse', array);
          fs.unlink('audio.wav', (err) => {
          if (err) throw err;
           });
        });
      break;
      case "voiceEnrollment":
      console.log(recording);
      fs.appendFileSync("audio.wav", new Buffer.alloc(recording.length,recording));
      myVoiceIt.createVoiceEnrollment({
        userId: "usr_9d2bffcd2540450f9c9e75f393ebe876",
        contentLanguage : "en-US",
        audioFilePath : "audio.wav",
        phrase: phrase
      },(jsonResponse)=>{
        var array = [jsonResponse, type];
        console.log(jsonResponse);
        io.emit('requestResponse', array);
          fs.unlink('audio.wav', (err) => {
          if (err) throw err;
           });
        });
        break;
        case "faceEnrollment":
        console.log(recording);
        fs.appendFileSync("video.mp4", new Buffer.alloc(recording.length,recording));
        myVoiceIt.createFaceEnrollment({
          userId: "usr_9d2bffcd2540450f9c9e75f393ebe876",
          videoFilePath : "video.mp4"
        },(jsonResponse)=>{
          var array = [jsonResponse, type];
          console.log(jsonResponse);
          io.emit('requestResponse', array);
            fs.unlink('video.mp4', (err) => {
            if (err) throw err;
             });
          });
        break;
        case "faceVerification":
        console.log(type);
        fs.appendFileSync("video.mp4", new Buffer.alloc(recording.length,recording));
        myVoiceIt.faceVerification({
          userId: "usr_9d2bffcd2540450f9c9e75f393ebe876",
          contentLanguage : "en-US",
          videoFilePath: "video.mp4"
        },(jsonResponse)=>{
          var array = [jsonResponse, type];
          console.log(jsonResponse);
          io.emit('requestResponse', array);
            fs.unlink('video.mp4', (err) => {
            if (err) throw err;
             });
          });
        break;
        case "videoEnrollment":
        console.log(type);
        recording = recording.video;
        fs.appendFileSync("video.mov", new Buffer.alloc(recording.length,recording));
        myVoiceIt.createVideoEnrollment({
          userId: "usr_9d2bffcd2540450f9c9e75f393ebe876",
          contentLanguage : "en-US",
          videoFilePath : "video.mov",
          phrase: phrase
        },(jsonResponse)=>{
          var array = [jsonResponse, type];
          console.log(jsonResponse);
          io.emit('requestResponse', array);
            fs.unlink('video.mov', (err) => {
            if (err) throw err;
             });
          });
        break;
        case "videoVerification":
        recording = recording.video;
        console.log(recording);
        fs.appendFileSync("video.mov", new Buffer.alloc(recording.length,recording));
        myVoiceIt.videoVerification({
          userId: "usr_9d2bffcd2540450f9c9e75f393ebe876",
          contentLanguage : "en-US",
          videoFilePath : "video.mov",
          phrase: phrase
        },(jsonResponse)=>{
          var array = [jsonResponse, type];
          console.log(jsonResponse);
          io.emit('requestResponse', array);
            fs.unlink('video.mov', (err) => {
            if (err) throw err;
             });
          });
        break;
        case "deleteEnrollments":
        myVoiceIt.getAllEnrollmentsForUser({
          userId: "usr_9d2bffcd2540450f9c9e75f393ebe876",
        },(jsonResponse)=>{
          console.log(jsonResponse);
          var array = [jsonResponse, type];
          io.emit('requestResponse', array);
          });
        break;
        case "getPhrases":
        myVoiceIt.getPhrases({
          lang: contentLanguage,
        },(jsonResponse)=>{
          console.log(jsonResponse);
          var array = [jsonResponse, type];
          io.emit('requestResponse', array);
          });
        break;
        default:
      }
  };

app.get('/', function(req, res) {
});

//Handle client-node communication
io.on('connection', function(socket){
  socket.on('initiate', function(count){
    tests = shuffle(tests);
    testNum = count;
    currTest = tests[testIndex];
    socket.emit('initiated', currTest);
  });
  socket.on('data', function(faceObject) {
    face = faceObject;
    if (oldTest != currTest){
      console.log("testing for: " + currTest);
      oldTest = currTest;
    }
    doLiveness(currTest,face);
    if (passed){
      passedTests = passedTests + 1;
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
  socket.on('apiRequest', function(array){
    console.log(array);
    handleClientRequest(array[0],array[1],array[2],array[3]);
  });
});

http.listen(8000, function() {
  console.log('Listening on *:8000');
});
