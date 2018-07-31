# VoiceIt2 Web Login Kit
The repository contains an example web demonstration of VoiceIt's API 2.0 use-cases. Scroll below for instructions for implementing parts of the demo into your own projects.

## Web Demo 

#### Getting the Credentials 
Before unpacking the demo, plese make sure create a Developer account at https://voiceit.io/signup. Upon completion, 
login and navigate to the "Settings tab" at the bottom lower left corner. Click "Activate API 2" to get the Api Key and Token, both of which wil be used later on. Also, navigate to "User Management" tab and click "Create a User". This will create a new User ID which will be needed later on. 

#### Getting the Dependecies 
Please clone or download this repository. First, make sure you have node JS installed:
```
brew install node
```
Also, make sure to install ffmpeg:
```
brew install ffmpeg
```
Finally, unpack the contents, and cd into the root. Run:
```
npm install
```
This will get the required dependecies for the demo.

#### The Config File 
Before starting the demo, please navigate to voiceit2-web-login-example/config.js. The config file hosts options that initiates the voiceIt Back End module with the given options. Please replace the 'API_KEY_HERE' with your API Key, and 'API_TOKEN_HERE' with your API Token. Change other options as per your preferences.

#### The User Id
A userId will be needed for most API calls. For the demo, we've created a Users file that has a simple oobject of User Email to User Details. In a real scenario, a User ID could be fetched from a database, a session, etc. 
Please navigate to voiceit2-web-login-example/users.js, and replace 'USER_ID_HERE' with a user Id from your account. 

#### Running the demo
After the steps above, run the following to start the demo server:
```
npm start
```
This will start the server at http://localhost:8000. Please navigate to http://localhost:8000. 
In the email input, type: 'demo@voiceit.io'. In the password input, type: 'voiceit123'. After submitting the form, further verification/enrollment methods will appear that you can test out. 

## Incorporating the Kit
Parts of the demo can be incorporated for any specific use-case, for instance, voice-only verification, or face-only verification with liveness, or video-only enrollment, etc. For any such use-case, a backend and fronted implementation is required:

### Back End Implementation

