function voiceIt2HTML() {
  var script = document.createElement('script');
  script.src = 'voiceItFront/voiceItJs/misc/createDynamicHTML.js';
  document.head.appendChild(script);

  this.init = function() {
    var voiceInitiator = new modalHtmlStructure();
    voiceInitiator.init();
  }
}
