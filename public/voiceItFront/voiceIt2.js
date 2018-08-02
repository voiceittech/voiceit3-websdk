function voiceIt2HTML() {
  var script = document.createElement('script');
  script.src = 'voiceItFront/voiceItJs/misc/createDynamicHTML.js';
  document.head.appendChild(script);

  this.myVoiceIt;

  //when VoiceIt2 Obj has loaded, and the HTML has been appended.
  this.onLoad = function(){
    return;
  }

  this.init = function() {
    var voiceInitiator = new voiceItHtmlStructure();
    voiceInitiator.init();
    setTimeout( ()=>{
      this.myVoiceIt = new voiceIt2Obj();
      this.myVoiceIt.init();
    },800);
  }

  this.initVoiceEnrollment = function(){
    this.myVoiceIt.encapsulatedVoiceEnrollment();
  }

  this.initVoiceVerification = function(){
    this.myVoiceIt.encapsulatedVoiceVerification();
  }

  this.initFaceVerification = function(){
    this.myVoiceIt.encapsulatedFaceVerification();
  }

  this.initFaceEnrollment = function(){
    this.myVoiceIt.encapsulatedFaceEnrollment();
  }

  this.initVideoEnrollment = function(){
    this.myVoiceIt.encapsulatedVideoEnrollment();
  }

  this.initVideoVerification = function(){
    this.myVoiceIt.encapsulatedVideoVerification();
  }

}
