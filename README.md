# VoiceIt API 2 Web SDK
The repository contains an example [web demonstration](#webexample) of VoiceIt's API 2.0 in the browser with a PHP backend. Please navigate to [Incorporating the SDK](#incorporating-the-sdk) for instructions on how to integrate the SDK into your own project(s).

* [Prerequisites](#prerequisites)
* [Recommended Platform](#recommended-platform)
* [Compatible Platforms](#compatible-platforms)
* [Web Example](#webexample)
	* [UI Screenshots](#ui-screenshots)
	* [Getting Started](#getting-started)
		* [Getting the Credentials](#getting-the-credentials)
		* [The Config File](#the-config-file)
		* [Running the example](#running-the-example)
* [Incorporating the SDK](#incorporating-the-sdk)
	* [Backend Implementation](#backend-implementation)
		* [Initializing the Base Module](#initializing-the-base-module)
		* [Getting the result](#result)
		* [Generating a Secure Token](#generating-a-secure-token)
	* [Frontend Implementation](#front)
		* [Initializing the frontend](#intializing-the-frontend)
		* [Setting the Secure Token](#setting-the-secure-token)
		* [Initializing the Enrollment and Verification UI](#initializing-the-enrollment-and-verification-ui)
			* [Encapsulated Voice Enrollment](#encapsulated-voice-enrollment)
			* [Encapsulated Face Enrollment](#encapsulated-face-enrollment)
			* [Encapsulated Video Enrollment](#encapsulated-video-enrollment)
			* [Encapsulated Voice Verification](#encapsulated-voice-verification)
			* [Encapsulated Face Verification](#encapsulated-voice-verification)
			* [Encapsulated Video Verification](#encapsulated-video-verification)
* [Getting Help](#getting-help)
* [Disclaimer](#disclaimer)
* [TODO](#todo)

## Prerequisites
* PHP 5.0 or greater
* PHP Compatible Server such as Apache

## Recommended Platform
<img width="35px" src="http://pngimg.com/uploads/chrome_logo/chrome_logo_PNG17.png" alt="Google Chrome"/>

## Compatible Platforms
<img style="display: inline-block" width="35px" src="https://upload.wikimedia.org/wikipedia/commons/e/e7/Mozilla_Firefox_3.5_logo_256.png" alt="Firefox"/>    <img style="display: inline-block" width="35px" src="https://upload.wikimedia.org/wikipedia/commons/d/d4/Opera_browser_logo_2013.png" alt="Google Chrome"/>

## Web Example

### UI Screenshots
The following show Voice Verification, Face Verification (With liveness detection on) and Video Verification (with Liveness turned off), respectively.

<img width="290px" src="./graphics/voiceVerification.gif" style="display: inline !important"/><img width="290px" src="./graphics/faceVerification.gif" style="display: inline-block !important;"/><img width="290px" src="./graphics/videoVerification.gif" style="display: inline-block !important;"/>

### Getting Started

#### Getting the Credentials
Before unpacking the repo, please make sure to create a Developer account at https://voiceit.io/signup. Upon completion,
login and navigate to the "Settings tab" to view your Api Key and Token, both of which will be needed later on. Also, navigate to the "User Management" tab and click "Create a User". This will create a user with a User ID which will be needed later on.

#### The Config File
Before starting the Example, please navigate to `VoiceItApi2WebSDK/php-example/config.php`. Please replace the `API_KEY_HERE` with your API Key, and `API_TOKEN_HERE` with your API Token. And add the userId created in the User Management section before in place of the `TEST_USER_ID_HERE`.

#### Running the Example
Start your server(Apache), pointing to the `VoiceItApi2WebSDK/php-example` directory as the document root directory.
Now visit your server at its designated port in an appropriate browser, and you should see a demo login page.

In the email input, type: `demo@voiceit.io`. In the password input, type: `demo123`. After submitting the form, further verification/enrollment methods will appear that you can test out. Please first do an enrollment, such as a face enrollment, then after a successful enrollment you can test the face verification method (Note: you will need to give your browser both microphone and camera permissions to test the demo).

## Incorporating the SDK
Parts of the Example can be incorporated for any specific use-case. Each type (voice, face, and video), and each action (enrollment, and verification with/without Liveness), can be implemented independently, providing a total of 27 different use-cases (such as voice-only verification, or face enrollment and video verification, or video-only verification with Liveness, to name a few). For any such use-case, a backend and frontend implementation is required:

### Backend Implementation
Please copy the folder `VoiceItApi2WebSDK/voiceit-php-backend` to you project root.

The base module for the backend is `VoiceItApi2WebSDK/voiceit-php-backend/VoiceIt2VoiceIt2WebBackend.php`. This module is responsible for making API calls, and communicating between the client and VoiceIt's API, it will deal with the processes required to perform a specific action (any from the possible 27) for a specific user, in a specific web session.

#### Initializing the Base Module
Initialize the base module in file that is publicly accessible via the server, such as `VoiceItApi2WebSDK/php-example/example_endpoint/index.php`. Then initialize the VoiceIt2VoiceIt2WebBackend like the following

```php
// Note: You might have to modify the require path of the voiceit-php-backend folder
// depending on where you placed the folder in your project
require('voiceit-php-backend/VoiceIt2WebBackend.php');
// Replace these strings with your own credentials
$myVoiceIt = new VoiceIt2WebBackend("VOICEIT_API_KEY_HERE", "VOICEIT_API_TOKEN");

// Define a callback function to capture the response when a verification request completes.

function voiceItResultCallback($jsonObj){
	// $jsonObj is a php object following the json format as described below
  $callType = $jsonObj["callType"];
  $userId = $jsonObj["userId"];
  if($jsonObj["jsonResponse"]["responseCode"] == "SUCC"){
  	// User was successfully verified now log them in via the
		// backend, this could mean starting a new session with
		// their details, after you lookup the user with the
		// provided VoiceIt userId
  }
}

// Initialize the backend, passing a reference to the $_POST, $_FILES objects so
// the backend can successfully capture form parameters and files, and finally
// a callback to handle the API response on the server side.
$myVoiceIt->InitBackend($_POST, $_FILES, voiceItResultCallback);
```

#### Getting the Result
After the completion of any verification action, the voiceItResultCallback will be triggered. The result response will be of the following json structure:

```json
{
	"callType": "faceVerification",
	"userId": "usr_********************",
	"jsonResponse": {
		"faceConfidence": 100,
		"message": "Successfully verified face for user with userId : usr_********************",
		"timeTaken": "2.249s",
		"responseCode": "SUCC",
		"status": 200
	}
}
```

#### Generating a Secure Token
Similarly to `VoiceItApi2WebSDK/php-example/login/index.php` you need to initialize the backend and then generate a secure token for the user in the backend, and send it to front end via an API call, or any means once the user is successfully authenticated via a username and password login or any other means. This token is then passed to the frontend to authorize the biometric login. Here is an example of how to generate the token in the backend.

```php
// Note: You might have to modify the require path of the voiceit-php-backend folder
// depending on where you placed the folder in your project
require('voiceit-php-backend/VoiceIt2WebBackend.php');
// Upon a successful login, lookup the associated VoiceIt userId
$VOICEIT_USERID = "VOICEIT_USER_ID_AFTER_DATABASE_LOOKUP";
header("HTTP/1.1 200 OK");
// Initialize module and replace this with your own credentials
$myVoiceIt = new VoiceIt2WebBackend("VOICEIT_API_KEY_HERE", "VOICEIT_API_TOKEN_HERE");
// Generate a new token for the userId
$createdToken = $myVoiceIt->generateTokenForUser($VOICEIT_USERID);
// Then return this token to the front end, for example as part of a jsonResponse
$jsonResponse = Array(
	"ResponseCode" => "SUCC",
	"Message" => "Successfully logged in user",
	"Token" => $createdToken
);
echo json_encode($jsonResponse);
```

### Frontend Implementation
The frontend can be implemented in a modular fashion - each type (voice, face, and video), and each action (enrollment, and verification with/without liveness), can be implemented independently.

#### Initializing the frontend

To incorporate the frontend, please copy the files `VoiceItApi2WebSDK/dist/voiceit2.min.js` and `VoiceItApi2WebSDK/dist/face_detector.wasm` to your public directory exposed via the web server or to a designated folder for other included javascript files on the webpage for authentication.

Then include the minified JavaScript file `voiceit2.min.js` via a script tag on your the webpage.

```html
<script src='/voiceit2.min.js'></script>
```

Now we can initialize the frontend object, it takes relative public web path to the PHP end point that called the `$myVoiceIt->InitBackend` method and the path to web assembly model of the Face Detector, used for liveness. This should have been copied to the server's public directly in the step [Initializing the frontend](#initializing-the-frontend) above.

```javascript
// The
var myVoiceIt = new VoiceIt2.initialize('/example_endpoint/', '/face_detector.wasm');
```

#### Setting the secure token
Once the frontend is initialized, you can set the secure token obtained via the backend(note: this secure token is unique for every userId and needs to be regenerated if a different user is attempting to log in) during the [Generating a Secure Token](#generating-a-secure-token) section above. Simply call `setSecureToken` like this:

```JavaScript
myVoiceIt.setSecureToken('TOKEN_OBTAINED_FROM_BACKEND');
```

#### Initializing the Enrollment and Verification UI

To start the UI for any of the use-cases mentioned above, please call the appropriate encapsulated method as shown below

##### Encapsulated Voice Enrollment
```JavaScript
myVoiceIt.encapsulatedVoiceEnrollment({
	contentLanguage:'en-US',
	phrase:'never forget tomorrow is a new day',
	completionCallback:function(success){
		if(success){
			alert('Voice Enrollments Done!');
		} else {
			alert('Voice Enrollments Cancelled or Failed!');
		}
	}
});
```

##### Encapsulated Face Enrollment
```JavaScript
myVoiceIt.encapsulatedFaceEnrollment({
	completionCallback:function(success){
		if(success){
			alert('Face Enrollment Done!');
		} else {
			alert('Face Enrollment Cancelled or Failed!');
		}
	}
});
```

##### Encapsulated Video Enrollment
```JavaScript
myVoiceIt.encapsulatedVideoEnrollment({
	contentLanguage:'en-US',
	phrase:'never forget tomorrow is a new day',
	completionCallback:function(success){
		if(success){
			alert('Video Enrollments Done!');
		} else {
			alert('Video Enrollments Cancelled or Failed!');
		}
	}
});
```

##### Encapsulated Voice Verification
```JavaScript
myVoiceIt.encapsulatedVoiceVerification({
	contentLanguage:'en-US',
	phrase:'never forget tomorrow is a new day',
	needEnrollmentsCallback:function(){
		// Three voice enrollments needed
		alert('A minimum of three enrollments are needed')
	},
	completionCallback:function(success){
		if(success){
			// Successfully verified user, now user can
			// be redirected to a protected page
			// Note: In addition to successfully verifying the user on
			// the frontend make sure to also check the json response on
			// the backend and successfully verify on the backend for true security.
			alert('Successfully verified voice');
		}
	}
});
```

##### Encapsulated Face Verification
```JavaScript
myVoiceIt.encapsulatedFaceVerification({
	doLiveness:true,
	completionCallback:function(success){
		if(success){
			// Successfully verified user, now user can
			// be redirected to a protected page
			// Note: In addition to successfully verifying the user on
			// the frontend make sure to also check the json response on
			// the backend and successfully verify on the backend for true security.
			alert('Successfully verified face');
		} else {
			alert('Face Verification Cancelled or Failed!');
		}
	}
});
```

##### Encapsulated Video Verification
```JavaScript
myVoiceIt.encapsulatedVideoVerification({
	doLiveness:true,
	contentLanguage:'en-US',
	phrase:'never forget tomorrow is a new day',
	needEnrollmentsCallback:function(){
		// Three video enrollments needed
		alert('A minimum of three enrollments are needed')
	},
	completionCallback:function(success){
		if(success){
			// Successfully verified user, now user can
			// be redirected to a protected page
			// Note: In addition to successfully verifying the user on
			// the frontend make sure to also check the json response on
			// the backend and successfully verify on the backend for true security.
			alert('Successfully verified face and voice');
		}
	}
});
```

## Getting Help
Need implementation help? Found a bug? Please contact support@voiceit.io.

### Disclaimer
Please note this is a Beta version - Feel free to document any errors/bugs in the issues section of the repository.

### TODO

- [x] Test on Chrome (Mac)
- [x] Test on Chrome (Linux)
- [x] Test on Chrome (Windows 10)
- [x] Test on Chrome (Android) - without liveness
- [x] Test on Firefox (Mac)
- [x] Test on FireFox (Linux)
- [ ] Test on Firefox (Windows 10)
- [ ] Test on Edge (Windows 10)
- [ ] Test on Windows 10
- [x] Test on Opera (Mac)
