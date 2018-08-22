function prompts () {
  var main = this;
  this.phrases = ["Never forget tomorrow is a new day"
                  ];

  this.currPhrase = this.phrases[0];

  this.getPhrase = function (int)  {
    return this.phrases[int];
  }

  this.setCurrPhrase = function (phrase)  {
    main.currPhrase = phrase;
    this.prompts.PDNM = "Please make sure you are saying the correct phrase: \"" + main.currPhrase + "\"";
    this.prompts.ENROLL_0 = "Please say: \"" + main.currPhrase + "\'";
    this.prompts.ENROLL_1 = "Please say: \"" + main.currPhrase +"\" again";
    this.prompts.ENROLL_2 = "Please say: \""+ main.currPhrase +"\" once more";
    this.prompts.VERIFY = "Please say \"" + main.currPhrase +"\"";
  }

  this.addPhrase = function (phrase)  {
    this.phrases.push(phrase);
  }

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
  VERIFY : "Please say \"" + main.currPhrase +"\"",
  VERIFY_FACE : "Please wait while we run verification",
  ENROLL_FACE: "Please wait while we run enrollment",
  VERIFY_FACE_FAILED : "Failed face verification",
  VERIFY_FACE_FAILED_TRY_AGAIN : "Failed face verification. Please Try again.",
  VIDEO_VERIFY_FAILED : "Failed video verification",
  ENROLL_0: "Please say: \"" + main.currPhrase + "\'",
  ENROLL_1: "Please say: \"" + main.currPhrase +"\" again",
  ENROLL_2: "Please say: \""+ main.currPhrase +"\" once more",
  FACE_ENROLL: "Please wait for your face to be enrolled",
  WAITING: "Please wait",
  WAIT_FOR_FACE_VERIFICATION : "Please wait while we verify your face",
  TOO_MANY_ATTEMPTS : "Sorry! you failed too many times!! Try again later.",
  SUCC_ENROLLMENT_1 : "First enrollment has been successful",
  SUCC_ENROLLMENT_2: "Second enrollment has been successful",
  SUCC_ENROLLMENT_3: "You've been successfully enrolled",
  SUCC_VERIFICATION: "You've been successfully verified",
  SUCC: "You've been successfully verified",
  /* Response Code Based Prompts */
  PDNM: "Please make sure you are saying the correct phrase: \"" + main.currPhrase + "\"" ,
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
  MAX_ATTEMPTS: "Exceeded maximum attempts allowed. Please try later",
  /* Liveness Prompts */
  SMILE : "Please smile broadly",
  YAWN: "Please yawn widely",
  FACE_DOWN: "Please turn your face slightly down and back",
  BLINK : "Please blink three times",
  FACE_LEFT : "Please turn your face slightly to the left and back",
  FACE_RIGHT : "Please turn your face slightly to the right and back ",
  LIVENESS_SUCCESS : "You've been successfully verified",
  LIVENESS_TIMEDOUT: "Sorry, liveness timed out. Please perform the liveness tests quickly",
  LIVENESS_FAILED: "Sorry, verification failed",
  LIVENESS_TRY_AGAIN: "Test failed, please try again",
  LIVENESS_TRY_AGAIN_AND_TURN_BACK: "Test failed, please turn your face back straight quickly"
};
}
