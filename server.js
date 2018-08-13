const express = require('express');
const app = express();
const crypto = require('crypto');
const fs = require('fs');
const users = require('./users.js');
var http = require('http');
const phrases = require('./phrases.js');

//the config file
const config = require('./config.js');
const voiceItModule = require('./voiceItBackEnd/js/VoiceItBase.js');
const bodyParser = require('body-parser');
var voiceItBackEnd;
app.use(express.static('public'));
app.use(bodyParser.json());

var server = http.Server(app);

server.listen(8000, () => {
  console.log('Listening on *:8000');
});


//The voiceitBackBnd module must be initialized only once
voiceItBackEnd = new voiceItModule({
  userId: "",
  apiKey: config.VOICEIT_API_KEY,
  apiToken: config.VOICEIT_API_TOKEN,
  contentLanguage: config.contentLanguage,
  phrase: config.phrase,
  numLivTests: 3,
  maxLivTries: 2
}, server);


voiceItBackEnd.on('result', function(result){
  console.dir(result);
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
          //Update the user that the module should deal with
          voiceItBackEnd.updateUser(user.id);
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
