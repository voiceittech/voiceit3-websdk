const express = require('express')
const session = require('express-session')
const bodyParser = require('body-parser')
const config = require('./config')
const VoiceIt2WebSDK = require('../voiceit-node-websdk')
const app = express()
const port = 3000

app.set('views', __dirname + '/views');
app.engine('html', require('ejs').renderFile);

app.use(session({
  secret: 'supersecretsessionkey',
  resave: false,
  saveUninitialized: true,
}))

app.use('/favicon.ico', express.static('public/images/favicon.ico'));
// parse application/json
app.use(bodyParser.json())
// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: true }))
// for parsing multipart/form-data
const multer = require('multer')()
// serve all static files in public directory
app.use(express.static('public'))

var sess;
app.get('/login', function (req, res) {
  sess = req.session;
  if(req.query.email === config.DEMO_EMAIL && req.query.password === config.DEMO_PASSWORD){
    const myVoiceIt = new VoiceIt2WebSDK(config.VOICEIT_API_KEY, config.VOICEIT_API_TOKEN, {sessionExpirationTimeHours:config.SESSION_EXPIRATION_TIME_HOURS});
    const generatedToken = myVoiceIt.generateTokenForUser(config.VOICEIT_TEST_USERID);
    res.json({
      'ResponseCode': 'SUCC',
      'Message' : 'Successfully authenticated user',
      'Token' : generatedToken
    });
  } else if (req.query.password !== config.DEMO_PASSWORD){
    res.json({
      'ResponseCode': 'INPW',
      'Message' : 'Incorrect Password'
    });
  } else {
    res.json({
      'ResponseCode': 'UNFD',
      'Message' : 'User not found'
    });
  }
});

app.get('/logout', function (req, res) {
  sess = req.session;
  req.session.destroy(function(err) {
  if(err) {
    console.log(err);
  } else {
    res.redirect('/');
  }
  });
});

app.get('/console', function (req, res) {
  sess = req.session;
  if(sess.userId){
    res.render('console.html');
  } else {
    res.redirect('/');
  }
})

app.post('/example_endpoint', multer.any(), function (req, res) {
    sess = req.session;
    const myVoiceIt = new VoiceIt2WebSDK(config.VOICEIT_API_KEY, config.VOICEIT_API_TOKEN,{sessionExpirationTimeHours:config.SESSION_EXPIRATION_TIME_HOURS});
    myVoiceIt.makeCall(req, res, function(jsonObj){
      const callType = jsonObj.callType.toLowerCase();
      const userId = jsonObj.userId;
      if(jsonObj.jsonResponse.responseCode === "SUCC"){
        // Activate Session with userId
        sess.userId = userId;
      }
    });
});

app.listen(port, () => console.log(`Node Example Server running on port ${port}`))
