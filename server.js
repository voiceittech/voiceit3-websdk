const express = require('express');
const app = express();
const users = require('./js/users.js');
const server = require('http').Server(app);
//the config file
const config = require('./config.js');
const voiceItModule = require('./js/VoiceItBase.js');
const bodyParser = require('body-parser');
var voiceItBackEnd;
app.use(express.static('public'));
app.use(bodyParser.json());


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
          contentLanguage: 'en-US',
          phrase: 'Never forget tomorrow is a new day',
          numLivTests: 3
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

server.listen(8000, () => {
  console.log('Listening on *:8000');
});
