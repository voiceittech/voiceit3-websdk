# VoiceIt2 Web Login Example and Kit
The repository contains an example web demonstration of VoiceIt's API 2.0 use-cases. Scroll down for instructions on how to integrate parts of the Example into your own projects.

#### Prerequisites 
<ul>
  <li><img width="40px" src="https://png.icons8.com/color/1600/nodejs.png" alt="Node Js"/>
  <li><img width="50px" src="https://s24255.pcdn.co/wp-content/uploads/2017/02/ffmpeg-logo.png" alt="FFMPEG"/>
</ul>

#### Recommended Platform
<img width="35px" src="http://pngimg.com/uploads/chrome_logo/chrome_logo_PNG17.png" alt="Google Chrome"/>

## Web Example 

### Snapshot 
<img width="640px" src="./demoGif.gif"/>

### Getting Started

#### Getting the Credentials 
Before unpacking the repo, plese make sure to create a Developer account at https://voiceit.io/signup. Upon completion, 
login and navigate to the "Settings tab" at the bottom lower left corner. Click "Activate API 2.0" to get your Api Key and Token, both of which will be needed later on. Also, navigate to the "User Management" tab and click "Create a User". This will create a user with a User ID which will be needed later on.

#### Getting the Dependencies
Please clone or download this repository. First, make sure you have node JS installed;

OSX:
```
brew install node
```
Linux:
```
sudo apt-get install nodejs
```
Also, make sure you have ffmpeg installed;

OSX:
```
brew install ffmpeg
```
Linux:
```
sudo apt-get install ffmpeg
```
Finally, unpack the contents, and cd into the root directory. Run:
```
npm install
```
This will get the required dependencies for the Example.

#### The Config File 
Before starting the Example, please navigate to voiceit2-web-login-example/config.js. The config file hosts options that initiate the voiceIt Back-End module. Please replace the 'API_KEY_HERE' with your API Key, and 'API_TOKEN_HERE' with your API Token. Change other options as per your preferences.

#### The User Id
A userId will be needed for most API calls. For the Example, we've created a users file that has a simple object with key/value pair of user-email to User-Details . In a real scenario, a voiceIt User ID could be fetched from a database, a session, etc. 
Please navigate to voiceit2-web-login-example/users.js, and replace 'USER_ID_HERE' with a user Id from your account. 

#### Running the Example
After the steps above, run the following to start the Example server:
```
npm start
```
This will start the server at http://localhost:8000. Please navigate to http://localhost:8000. 
In the email input, type: 'demo@voiceit.io'. In the password input, type: 'voiceit123'. After submitting the form, further verification/enrollment methods will appear that you can test out. 

## Incorporating the Kit
Parts of the Example can be incorporated for any specific use-case. Each type (voice, face, and video), and each action (enrollment, and verification w/wo Liveness), can be implemented independently, providing a total of 27 use-cases (such as voice-only verification, or face and voice enrollment, or video-only verification w/ Liveness, to name a few). For any such use-case, a backend and fronted implementation is required:

### Backend Implementation
Please copy the folder voiceit2-web-login-example/voiceItBackEnd to you project root.
The base module for the backend is voiceit2-web-login-example/voiceItBackEnd/js/voiceItBase.js. This module is responsible for post-recording processing, liveness detection math, handling socket communication with client, and making API calls, all done through voiceit2-web-login-example/voiceItbackEnd/js/voiceItApiWrapper.js-an altered version of our Node Wrapper.

#### Gathering Backend Dependencies

Before implementing voiceItBase, please add the following dependencies to your project's package.json, under the dependencies section:
```
...
..
  "dependencies": {
  ...
  ..
    "atob": "^2.1.1",
    "ejs": "^2.6.1",
    "express": "^4.16.3",
    "fluent-ffmpeg": "^2.1.2",
    "socket.io": "^2.1.1",
    "unirest": "^0.5.1",
    "ws": "^5.2.1"
  }
...
..
```
Make sure to run ```npm install``` after this.

#### Initializing the Base Module
To implement voiceItBase, either pass it a config file, such as voiceit2-web-login-example/config.js:
```
const server = require('http').Server(app);
const config = require('./config.js');

voiceItBackEnd = new voiceItModule(config, server);
```

Or pass it options directly:

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
Please make sure to use ```server.listen(....)``` rather than ```app.listen(...)```
Your server is now set up to communicate with the frontend.

### Frontend Implementation
The frontend can be implemented in a modular fashion- each type (voice, face, and video), and each action (enrollment, and verification w/wo Liveness), can be implemented independently.

#### Creating the HTML

To incorporate the Frontend, please copy the folder voiceit2-web-login-example/public/voiceItFront to your project directory.
Include voiceItFront/voiceIt2.js into your html:
```
<script src='YOUR_PROJECT_ROOT/voiceItFront/voiceIt2.js'/>
```
Now we can instansiate the voiceItFrontEndBase class:
```
var myVoiceIt = new voiceIt2FrontEndBase();
myVoiceIt.init()
``` 
This will gather fron-end dependencies (script and link tags), and create the html structure. This will also instansiate voiceIt2Obj as mentioned above.

#### Connecting to your UI

For any of the use-cases mentioned above, you need to call the init_ACTION_TYPE() menthod(s) of the voiceIt2FrontEndBase instance. Methods for Face and Video Verification take a boolean parameter for liveness (false by default). 

For instance, to start a face verification w/wo liveness process, you'd have to call:
```
myVoiceIt.init_Face_Verification(LIVENESS_BOOL);
```
This will reveal the UI Modal to start the face verification process.

Similarly: 
```
//Reveal the UI Modal to start the Voice Enrollment process
myVoiceIt.init_Voice_Enrollment();
```
```
//Reveal the UI Modal to start the Voice Verification process
myVoiceIt.init_Voice_Verification();
```

```
//Reveal the UI Modal to start the Face Enrollment process
myVoiceIt.init_Face_Enrollment()
```
```
//Reveal the UI Modal to start the Video Enrollment process
myVoiceIt.init_Video_Enrollment()
```

```
//Reveal the UI Modal to start the Video Verification process
myVoiceIt.init_Video_Verification(LIVENESS_BOOL)
```
The init_ACTION_TYPE() method(s) can be called dynamically from any action/event per your implementation. For instance, in the Example, the respective button clicks call the respective init_ACTION_TYPE() method, and the LIVENESS_BOOL is set by the UI toggle button.

## Getting Help 
Need implementation help? Found a bug? Please contact support@voiceit.io.

### Disclaimer
Please note this is a Beta verison- Feel free to document any errors/bugs in the issues section of the repository.

Full support for Safari and Firefox coming soon.

### TODO

- [x] Test on Chrome
- [ ] Safari Compatibility
- [ ] Test on Safari
- [ ] Firefox Compatibility
- [ ] Test on Firefox
- [ ] Test on Mobile Chrome
- [ ] Mobile Safari Compatibility
- [ ] Test on Mobile Safari
- [ ] Test on Windows 10



