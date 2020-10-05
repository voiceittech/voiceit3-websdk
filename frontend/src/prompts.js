export default function Prompts() {
  var promptsRef = this;
  promptsRef.currentPhrase = "";
  promptsRef.prompts = {
    CONTINUE: "Continue",
    CANCEL: "Cancel",
    DONE: "Done",
    VOICE_FACE_SETUP: "Setup Face + Voice Verification",
    VOICE_FACE_SETUP_SUBTITLE: "This lets you log in by verifying your face and voice",
    VOICE_FACE_READY: "Face + Voice verification is ready to use",
    VOICE_FACE_READY_SUBTITLE: "You can now use your face and voice instead of a password to securely log in",
    FACE_SETUP: "Setup Face Verification",
    FACE_SETUP_SUBTITLE: "This lets you log in by verifying your face",
    FACE_READY: "Face Verification is Ready",
    FACE_READY_SUBTITLE: "You can now use your face instead of a password to securely log in",
    VOICE_SETUP: "Setup Voice Verification",
    VOICE_SETUP_SUBTITLE: "This lets you log in by verifying your voice",
    VOICE_READY: "Voice Verification is Ready",
    VOICE_READY_SUBTITLE: "You can now use your voice instead of a password to securely log in",
    /* Prompts for Enrollment and Verification Flow */
    LOOK_INTO_CAM: "Please look into the camera",
    GET_ENROLLED: "There you are, let's get you enrolled",
    GET_VERIFIED: "There you are, let's get you verified",
    READY_FOR_VOICE_VERIFICATION: "Please get ready to verify your voice",
    VERIFY: function() {
      return "Please say<br/>\"" + promptsRef.currentPhrase + "\"";
    },
    VERIFY_FACE: "Please wait while we run verification",
    ENROLL_FACE: "Please wait while we run enrollment",
    VERIFY_FACE_FAILED: "Failed face verification",
    VERIFY_FACE_FAILED_TRY_AGAIN: "Failed face verification. Please Try again.",
    VIDEO_VERIFY_FAILED: "Failed video verification",
    ENROLL_0: function() {
      return "Please say<br/>\"" + promptsRef.currentPhrase + "\'";
    },
    ENROLL_1: function() {
      return "Please say<br/>\"" + promptsRef.currentPhrase + "\"<br/> again";
    },
    ENROLL_2: function() {
      return "Please say<br/>\"" + promptsRef.currentPhrase + "\"<br/> one last time";
    },
    FACE_ENROLL: "Please wait for your face to be enrolled",
    WAITING: "Please wait",
    WAIT_FOR_FACE_VERIFICATION: "Please wait while we verify your face",
    TOO_MANY_ATTEMPTS: "Sorry! you failed too many times!! Try again later.",
    SUCC_ENROLLMENT_1: "First enrollment was successful",
    SUCC_ENROLLMENT_2: "Second enrollment was successful",
    SUCC_ENROLLMENT_3: "You've been successfully enrolled",
    SUCC_VERIFICATION: "You've been successfully verified",
    SUCC: "You've been successfully verified",
    /* Response Code Based Prompts */
    PDNM: function() {
      return "Please make sure you are saying the correct phrase: \"" + promptsRef.currentPhrase + "\"";
    },
    FNFD: "Sorry, I couldn't quite see your face.\nPlease try again.",
    DDNE: "Sorry, something went wrong.\nPlease try again.",
    FAIL: "Failed.\nPlease try again.",
    IFWD: "Sorry, something went wrong.\nPlease try again.",
    SRNR: "Sorry, I couldn't quite hear you.\nPlease speak louder.",
    TVER: "Sorry, no video enrollments found.\nPlease enroll before verifying.",
    NFEF: "Sorry, no face enrollments found.\nPlease enroll before verifying.",
    NEHSD: "Sorry, I couldn't quite catch that.\nPlease speak slower.",
    NSPE: "Sorry, your enrollment was not similar enough to previous enrollments.\nMake sure to enroll only one person at a time.",
    STTF: "Sorry, I couldn't understand you. Make sure to say the correct phrase",
    SSTQ: "Sorry, I couldn't quite hear you.\nPlease speak louder.",
    SSTL: "Oh! Its getting a little too loud in here.\nLet's try this again, speaking at a normal volume",
    RWPU: "Please do not use recordings. Try that again.",
    FTMF: "Make sure only your face is visible.\nPlease try again.",
    PNTE: "Sorry, no voice enrollments found.\nPlease enroll before verifying.",
    GERR: "Sorry, something went wrong.\nPlease try again.",
    CONTACT_DEVELOPER: "Error:\n Please contact app developer with response code \"MESSAGE_HERE\".",
    UNFD: "User not found. Pease make sure you have the right user ID",
    MAX_ATTEMPTS: "Exceeded maximum attempts allowed. Please try again later",
    /* Liveness Prompts */
    LIVENESS_READY_PROMPT: "Please move closer to the camera. You\'ll be performing a predetermined number of liveness challenges. You\'ll have 2 seconds to perform each test, selected randomly from the following 3 :",
    LIVENESS_SUCCESS: "You've been successfully verified",
    LIVENESS_TIMEDOUT: "Sorry, liveness timed out. Please perform the liveness tests quickly",
    LIVENESS_FAILED: "Sorry, verification failed",
    LIVENESS_TRY_AGAIN: "Test failed, please try again",
    REENROLLMENT_WARNING: "Reenrollment will delete all previous voice, face, and video enrollments. \n Proceed?"
  };

  promptsRef.setCurrentPhrase = function(phrase) {
    promptsRef.currentPhrase = phrase;
  }

  promptsRef.getCurrentPhrase = function() {
    return promptsRef.currentPhrase;
  }

  promptsRef.getPrompt = function(promptName) {
    if (typeof promptsRef.prompts[promptName] === "function") {
      return promptsRef.prompts[promptName]();
    } else {
      return promptsRef.prompts[promptName];
    };
  }

}
