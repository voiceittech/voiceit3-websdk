const express = require('express');
const app = express();
const crypto = require('crypto');
const fs = require('fs');
const users = require('./users.js');
var https = require('https');

//the config file
const config = require('./config.js');
const voiceItModule = require('./voiceItBackEnd/js/VoiceItBase.js');
const bodyParser = require('body-parser');
var voiceItBackEnd;
app.use(express.static('public'));
app.use(bodyParser.json());

var options = {
  key: fs.readFileSync('/etc/apache2/ssl/localhost.key'),
  cert: fs.readFileSync('/etc/apache2/ssl/localhost.crt'),
  requestCert: false,
  rejectUnauthorized: false,
  agent: false,
  strictSSL: false
};

var server = https.Server(options, app);

server.listen(5000, () => {
  console.log('Listening on *:5000');
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
        voiceItBackEnd = new voiceItModule({
          userId: user.id,
          apiKey: config.VOICEIT_API_KEY,
          apiToken: config.VOICEIT_API_TOKEN,
          contentLanguage: config.contentLanguage,
          phrase: config.phrase,
          numLivTests: 2
        }, server);
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
