function voiceIt2FrontEndBase() {
  var script = document.createElement('script');
  script.src = 'voiceItFront/voiceItJs/misc/createDynamicHTML.js';
  document.head.appendChild(script);

  this.myVoiceIt;
  var voiceInitiator;

  //TODO: when VoiceIt2 Obj has loaded, and the HTML has been appended.
  this.onLoad = function() {
    return;
  }

  this.init = function() {
    setTimeout(() => {
      voiceInitiator = new voiceItHtmlStructure();
      voiceInitiator.init();
      setTimeout(() => {
        this.myVoiceIt = new voiceIt2Obj();
        this.myVoiceIt.init();
      }, 800);
    }, 100);
  }

  this.init_Voice_Enrollment = () => {
    if (this.myVoiceIt == undefined) {
      setTimeout(() => {
        console.log('loading VocieItObj...');
        this.init_Voice_Enrollment();
      }, 100);
    } else {
      this.myVoiceIt.encapsulatedVoiceEnrollment();
    }
  }

  this.init_Voice_Verification = () => {
    if (this.myVoiceIt == undefined) {
      setTimeout(() => {
        console.log('loading VocieItObj...');
        this.init_Voice_Verification();
      }, 100);
    } else {
      this.myVoiceIt.encapsulatedVoiceVerification();
    }
  }

  this.init_Face_Verification = (liveness) => {
    if (this.myVoiceIt == undefined) {
      setTimeout(() => {
        console.log('loading VocieItObj...');
        this.init_Face_Verification(liveness);
      }, 100);
    } else {
      this.myVoiceIt.encapsulatedFaceVerification(liveness);
    }
  }

  this.init_Face_Enrollment = () => {
    if (this.myVoiceIt == undefined) {
      setTimeout(() => {
        console.log('loading VocieItObj...');
        this.init_Face_Enrollment();
      }, 100);
    } else {
      this.myVoiceIt.encapsulatedFaceEnrollment();
    }
  }

  this.init_Video_Enrollment = () => {
    if (this.myVoiceIt == undefined) {
      setTimeout(() => {
        console.log('loading VocieItObj...');
        this.init_Video_Enrollment();
      }, 100);
    } else {
      this.myVoiceIt.encapsulatedVideoEnrollment();
    }
  }

  this.init_Video_Verification = (liveness) => {
    if (this.myVoiceIt == undefined) {
      setTimeout(() => {
        console.log('loading VocieItObj...');
        this.init_Video_Verification(liveness);
      }, 100);
    } else {
      this.myVoiceIt.encapsulatedVideoVerification(liveness);
    }
  }
}
