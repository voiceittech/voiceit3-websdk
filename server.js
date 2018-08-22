const express = require('express');
const app = express();
const fs = require('fs');
const users = require('./users.js');
var http = require('http');
const session = require('express-session');
const uuid = require('uuid/v1');
//the config file
const config = require('./config.js');
const voiceItModule = require('./voiceItBackEnd/js/VoiceItBase.js');
const bodyParser = require('body-parser');
var voiceItBackEnd;

var sessionMiddleware = session({
  resave: true,
  saveUninitialized: true,
  secret: uuid(),
  cookie: {}
});

app.use(sessionMiddleware);
app.use(express.static('public'));
express.static.mime.types["wasm"] = "application/wasm";
app.use(bodyParser.json());

var server = http.Server(app);

server.listen(8000, () => {
  console.log('Listening on *:8000');
});

//The voiceitBackBnd module must be initialized only once
voiceItBackEnd = new voiceItModule({
  apiKey: config.VOICEIT_API_KEY,
  apiToken: config.VOICEIT_API_TOKEN,
  numLivTests: 3,
  maxLivTries: 2
}, server, sessionMiddleware);

voiceItBackEnd.on('result', function(result){
  console.log(result);
});

//initiate the base voiceit Module
app.post('/authenticate', (req, res) => {
  var data;
  var email = req.body.email;
  var password = req.body.password;
  var user = users[email];
  if (user){
    if (password == user.password){
      data = {
        responseCode: "SUCC",
        Message: "Successfully authenticated user",
        UserId: user.id,
      };
      setTimeout(() => {
          //Create a new task for a specific user Id
          var task = new voiceItBackEnd.task({
              sessionID: req.sessionID,
              userId: user.id,
              contentLanguage: "en-US",
              phrase: "Never forget tomorrow is a new day"
            });
      },150);
      res.status(200).send(data);
    } else {
      data = {
        responseCode: "ICPW",
        Message: "Incorrect Password",
        UserId: "",
      };
      res.status(404).send(data);
    }
  } else {
    data = {
      responseCode: "UNFD",
      Message: "User not found",
      UserId: "",
    };
    res.status(404).send(data);
  }
});
