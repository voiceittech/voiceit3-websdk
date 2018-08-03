# VoiceIt2 Web Login Example and Kit
The repository contains an example web demonstration of VoiceIt's API 2.0 use-cases. Scroll below for instructions to implementing parts of the demo into your own projects.

## Web Demo 

#### Getting the Credentials 
Before unpacking the repo. plese make sure to create a Developer account at https://voiceit.io/signup. Upon completion, 
login and navigate to the "Settings tab" at the bottom lower left corner. Click "Activate API 2" to get the Api Key and Token, both of which will be needed later on. Also, navigate to "User Management" tab and click "Create a User". This will create a User ID which will be needed later on. 

#### Getting the Dependecies 
Please clone or download this repository. First, make sure you have node JS installed:
```
brew install node
```
Also, make sure you have ffmpeg installed:
```
brew install ffmpeg
```
Finally, unpack the contents, and cd into the root. Run:
```
npm install
```
This will get the required dependecies for the demo.

#### The Config File 
Before starting the demo, please navigate to voiceit2-web-login-example/config.js. The config file hosts options that initiate the voiceIt Back-End module with the given options. Please replace the 'API_KEY_HERE' with your API Key, and 'API_TOKEN_HERE' with your API Token. Change other options as per your preferences.

#### The User Id
A userId will be needed for most API calls. For the demo, we've created a Users file that has a simple object of User Email to User Details. In a real scenario, a voiceIt User ID could be fetched from a database, a session, etc. 
Please navigate to voiceit2-web-login-example/users.js, and replace 'USER_ID_HERE' with a user Id from your account. 

#### Running the demo
After the steps above, run the following to start the demo server:
```
npm start
```
This will start the server at http://localhost:8000. Please navigate to http://localhost:8000. 
In the email input, type: 'demo@voiceit.io'. In the password input, type: 'voiceit123'. After submitting the form, further verification/enrollment methods will appear that you can test out. 

## Incorporating the Kit
Parts of the demo can be incorporated for any specific use-case, for instance, voice-only verification, or face-only verification with liveness, or video and voice enrollment, etc. For any such use-case, a backend and fronted implementation is required:

### Back End Implementation

The base module for the back end will be voiceit2-web-login-example/js/voiceItBase.js. This module is responsibple for post-recording processing, doing liveness math, socket communication with client, and Api Calls, done through voiceit2-web-login-example/js/voiceItApiWrapper.js-a tweaked version of our Node Wrapper.

To implement voiceItBase, either pass it a config file, such as voiceit2-web-login-example/config.js:
```
const server = require('http').Server(app);
//the config file
const config = require('./config.js');

voiceItBackEnd = new voiceItModule(config, server);
```

Or initialise it by passing it options directly:

```
const server = require('http').Server(app);
voiceItBackEnd = new voiceItModule({
      userId: "USER_ID_HERE",
      apiKey: "API_KEY_HERE",
      apiToken: "API_TOKEN_HERE",
      contentLanguage: "CONTENT_LANG",
      phrase: "PHRASE",
      numLivTests: NUM_OF_LIVENESS_TESTS
    }, server);
```
This will set up your server to communicate with the front end.

### Front End Implementation
The front end can be implemented in a modular fashion- each type (voice, face, and video), and each action (enrollment, and verification w/wo Liveness), can be implemented independently, providing a total of 27 use-cases (such as voice-only verification, or face and voice enrollment, or video-only verification w/ Liveness, to name a few).

The gateway to front-end implementation is voiceit2-web-login-example/public/voiceItFront/voiceIt2.js. This is an initializer class that will gather and append all the dependecies to the DOM, create the required HTML structure for the main UI Modal (the pop-up Box from the Demo), and instansiate the voiceIt2Obj- this module is responsible for communicating with the server, and controlling the flow of the verification(s)/enrollment(s) processes. 
To incorporate the Front End, please copy the folder voiceit2-web-login-example/public/voiceItFront to your project directory.
Include voiceIt2.js into your html:
```
<script src='YOU_PROJECT_ROOT/voiceItFront/voiceIt2.js'>
```
Now we can instansiate the voiceItFrontEndBase class:
```
var myVocieIt = new voiceIt2FrontEndBase();
```
This will also instansiate voiceIt2Obj as mentioned above. 
You are now set up to connect the voiceIt2Obj to your UI. 
For any of the use-case mentioned above, you need to call the init_ACTION_TYPE() menthod(s) of the voiceIt2FrontEndBase instance. Methods for Face and Video Verification take a boolean parameter for liveness. 
For instance, to start a face verification w/liveness process, you'd have to call:
```
myVoiceIt.init_Face_Verification(LIVENESS_BOOL);
```
This will reveal the ui Modal (the pop-up box), ready to start the face verification w/liveness process.
Similarly: 
```
//Reveal the ui Modal, ready to start the vocie Enrollment process
myVoiceIt.init_Voice_Enrollment();
```
```
//Reveal the ui Modal, ready to start the vocie verification process
myVoiceIt.init_Voice_Verification();
```

```
//Reveal the ui Modal, ready to start the face Enrollment process
myVoiceIt.init_Face_Enrollment()
```
```
//Reveal the ui Modal, ready to start the video Enrollment process
myVoiceIt.init_Video_Enrollment()
```

```
//Reveal the ui Modal, ready to start the video Verification process
myVoiceIt.init_Video_Verification(LIVENESS_BOOL)
```
The init_ACTION_TYPE() mehtod(s) can be called dynamically from any action/event per your implementation. For instance, in the demo, the respective button clicks call the respective init_ACTION_TYPE() mehtod, and the LIVENESS_BOOL is set by the ui toggle button.

You are now all set up to provide voiceIt's API 2 services to clients. 

## Getting Help 
Need implementation help? Found a bug? Please contact support@voiceit.io.

### Disclaimer
Please note this is a Beta verison- Feel free to document any errors/bugs in the issues section of the repository.






