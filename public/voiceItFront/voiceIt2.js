function voiceIt2FrontEndBase() {
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
    setTimeout(()=>{
      this.myVoiceIt = new voiceIt2Obj();
      this.myVoiceIt.init();
    },800);
  }

  this.init_Voice_Enrollment = function(){
    this.myVoiceIt.encapsulatedVoiceEnrollment();
  }

  this.init_Voice_Verification = function(){
    this.myVoiceIt.encapsulatedVoiceVerification();
  }

  this.init_Face_Verification = function(liveness){
    this.myVoiceIt.encapsulatedFaceVerification(liveness);
  }

  this.init_Face_Enrollment = function(){
    this.myVoiceIt.encapsulatedFaceEnrollment();
  }

  this.init_Video_Enrollment = function(){
    this.myVoiceIt.encapsulatedVideoEnrollment();
  }

  this.init_Video_Verification = function(liveness){
    this.myVoiceIt.encapsulatedVideoVerification(liveness);
  }

}
