function prompts () {
  this.phrases = ["Never forget tomorrow is a new day", 
                  "My face and my voice identify me"
                  ];

  this.getPhrase = function(int){
    var a = this.phrases;
    return a[int];
  }


  // this.setPhrases = function(array){
  // for(var i = 0; i < array.length; i++){
  //   this.phrases[i] = array[i];
  //  }
  // }

  this.getPrompt = function(promptName){
    var s  = this.prompts[promptName];
    return s;
  };

  this.prompts  = {
  CONTINUE : "Continue",
  CANCEL : "Cancel",
  DONE : "Done",
  VOICE_FACE_SETUP : "Setup Face + Voice Verification",
  VOICE_FACE_SETUP_SUBTITLE : "This lets you log in by verifying your face and voice",
  VOICE_FACE_READY : "Face + Voice verification is ready to use",
  VOICE_FACE_READY_SUBTITLE : "You can now use your face and voice instead of a password to securely log in anytime",
  FACE_SETUP : "Setup Face Verification",
  FACE_SETUP_SUBTITLE : "This lets you log in by verifying your face",
  FACE_READY : "Face Verification is Ready",
  FACE_READY_SUBTITLE : "You can now use your face instead of a password to securely log in anytime",
  VOICE_SETUP : "Setup Voice Verification",
  VOICE_SETUP_SUBTITLE : "This lets you log in by verifying your voice",
  VOICE_READY : "Voice Verification is Ready",
  VOICE_READY_SUBTITLE: "You can now use your voice instead of a password to securely log in anytime",
  /* Prompts for Enrollment and Verification Flow */
  LOOK_INTO_CAM : "Please look into the camera",
  GET_ENROLLED : "There you are, let's get you enrolled",
  GET_VERIFIED : "There you are, let's get you verified",
  READY_FOR_VOICE_VERIFICATION : "Please get ready to verify your voice",
  VERIFY : "Please say \"" +this.phrases[0] +"\"",
  VERIFY_FACE : "Please wait while we run verification",
  ENROLL_FACE: "Please wait while we run enrollment",
  VERIFY_FACE_FAILED : "Failed face verification",
  VERIFY_FACE_FAILED_TRY_AGAIN : "Failed face verification. Please Try again.",
  VIDEO_VERIFY_FAILED : "Failed video verification",
  VRIFY: "Please say: " + this.phrases[0],
  ENROLL_0: "Please say: \"" + this.phrases[0] + "\'",
  ENROLL_1: "Please say: \"" + this.phrases[0] +"\" again",
  ENROLL_2: "Please say: \""+ this.phrases[0] +"\" once more",
  FACE_ENROLL: "Please wait for your face to be enrolled",
  WAITING: "Please wait",
  WAIT_FOR_FACE_VERIFICATION : "Please wait while we verify your face",
  TOO_MANY_ATTEMPTS : "Sorry! you failed too many times!! Try again later.",
  SUCC_E_1 : "First enrollment has been successful",
  SUCC_E_2: "Second enrollment has been successful",
  SUCC_E_3: "You've been successfully enrolled",
  SUCC_V: "You've been successfully verified",
  SUCC: "You've been successfully verified",
  /* Response Code Based Prompts */
  PDNM: "Please make sure you are saying the correct phrase: \"" + this.phrases[0] + "\"" ,
  FNFD : "Sorry, I couldn't quite see your face.\nPlease try again.",
  DDNE : "Sorry, something went wrong.\nPlease try again.",
  FAIL : "Failed.\nPlease try again.",
  IFWD: "Sorry, something went wrong.\nPlease try again.",
  SRNR: "Sorry, I couldn't quite hear you.\nPlease speak louder.",
  TVER: "Sorry, no video enrollments found.\nPlease enroll before verifying.",
  NFEF: "Sorry, no face enrollments found.\nPlease enroll before verifying.",
  NEHSD : "Sorry, I couldn't quite catch that.\nPlease speak slower.",
  STTF : "Sorry, I couldn't understand you. Make sure to say the correct phrase",
  SSTQ : "Sorry, I couldn't quite hear you.\nPlease speak louder.",
  SSTL : "Oh! Its getting a little too loud in here.\nLet's try this again, speaking at a normal volume",
  RWPU : "Please do not use recordings. Try that again.",
  FTMF: "Make sure only your face is visible.\nPlease try again.",
  PNTE: "Sorry, no voice enrollments found.\nPlease enroll before verifying.",
  GERR: "Sorry, something went wrong.\nPlease try again.",
  CONTACT_DEVELOPER : "Error:\n Please contact app developer with response code \"MESSAGE_HERE\".",
  UNFD: "User not found. Pease make sure you have the right user ID",
  /* Liveness Prompts */
  SMILE : "Please smile broadly",
  YAWN: "Please yawm",
  FACE_DOW: "Please Face Down",
  BLINK : "Please blink three times",
  FACE_LEFT : "Please turn your face to the left and back",
  FACE_RIGHT : "Please turn your face to the right and back ",
  LIVENESS_SUCCESS : "You've successfully passed liveness"
};
}
