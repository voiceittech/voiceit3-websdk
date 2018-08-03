function voiceItHtmlStructure() {
  this.modalStructure = [{
    "attributes": {
      "class": "ui modal",
      "id": "voiceItModal"
    },
    "nodeName": "div",
    "parent": "body"
  }, {
    "attributes": {
      "class": "close icon",
      "id": "closeButton"
    },
    "nodeName": "i",
    "parent": "#voiceItModal"
  }, {
    "attributes": {
      "class": "ui card",
      "id": "card"
    },
    "nodeName": "div",
    "parent": "#voiceItModal"
  }, {
    "attributes": {
      "class": "image",
      "id": "cardOverlay"
    },
    "nodeName": "div",
    "parent": "#card"
  }, {
    "attributes": {
      "id": "waveform",
      "width": "460",
      "height": "242"
    },
    "nodeName": "canvas",
    "parent": "#card"
  }, {
    "attributes": {
      "class": "content",
      "id": "content"
    },
    "nodeName": "div",
    "parent": "#card"
  }, {
    "attributes": {
      "class": "extra content",
      "id": "extra"
    },
    "nodeName": "div",
    "parent": "#card"
  }, {
    "attributes": {
      "id": "warningOverlay"
    },
    "nodeName": "div",
    "parent": "#cardOverlay"
  }, {
    "attributes": {
      "id": "overlayHolder"
    },
    "nodeName": "div",
    "parent": "#cardOverlay"
  }, {
    "attributes": {
      "id": "videoLiveness",
      "autoplay": "",
      "playsinline": ""
    },
    "nodeName": "video",
    "parent": "#cardOverlay"
  }, {
    "attributes": {
      "id": "headerA",
      "class": "header"
    },
    "nodeName": "a",
    "parent": "#content"
  }, {
    "attributes": {
      "id": "powered-by",
      "src": "voiceItFront/voiceItAssets/images/powered-by.png"
    },
    "nodeName": "img",
    "parent": "#extra"
  }, {
    "attributes": {
      "id": "wait2",
      "class": "svg",
      "src": "voiceItFront/voiceItAssets/images/bars.svg"
    },
    "nodeName": "img",
    "parent": "#warningOverlay"
  }, {
    "attributes": {
      "id": "warnText",
      "class": "ui header"
    },
    "nodeName": "span",
    "parent": "#warningOverlay",
    "text": "Reenrollment will delete all previous enrollments. \n Proceed?"
  }, {
    "attributes": {
      "id": "iconHolder"
    },
    "nodeName": "div",
    "parent": "#warningOverlay"
  }, {
    "attributes": {
      "id": "livenessText"
    },
    "nodeName": "h4",
    "parent": "#warningOverlay",
    "text": "Please move closer to the camera. You'll be performing a predetermined number of liveness challanges. You'll have 2 seconds to perform each test, selected randomly from the following 5:"
  }, {
    "attributes": {
      "id": "livenessTutorial",
      "src": "voiceItFront/voiceItAssets/images/livenessTutorial.svg"
    },
    "nodeName": "img",
    "parent": "#warningOverlay"
  }, {
    "attributes": {
      "id": "skipButton",
      "class": "ui basic label"
    },
    "nodeName": "a",
    "parent": "#warningOverlay",
    "text": "Skip"
  }, {
    "attributes": {
      "id": "overlay2"
    },
    "nodeName": "div",
    "parent": "#overlayHolder"
  }, {
    "attributes": {
      "width": "460",
      "height": "345",
      "id": "cv"
    },
    "nodeName": "canvas",
    "parent": "#overlayHolder"
  }, {
    "attributes": {
      "id": "readyButton",
      "class": "small ui customButton inverted basic button"
    },
    "nodeName": "button",
    "parent": "#overlayHolder",
    "text": "Ready?"
  }, {
    "attributes": {
      "id": "circle"
    },
    "nodeName": "div",
    "parent": "#overlayHolder"
  }, {
    "attributes": {
      "id": "imageData"
    },
    "nodeName": "canvas",
    "parent": "#overlayHolder"
  }, {
    "attributes": {
      "height": "460",
      "width": "465",
      "id": "videoCircle"
    },
    "nodeName": "svg",
    "parent": "#overlayHolder"
  }, {
    "attributes": {
      "id": "header"
    },
    "nodeName": "span",
    "parent": "#headerA"
  }, {
    "attributes": {
      "id": "wait",
      "class": "svg",
      "src": "voiceItFront/voiceItAssets/images/bars.svg"
    },
    "nodeName": "img",
    "parent": "#headerA"
  }, {
    "attributes": {
      "id": "leftIcon",
      "class": "ic icon arrow circle left"
    },
    "nodeName": "i",
    "parent": "#iconHolder"
  }, {
    "attributes": {
      "id": "rightIcon",
      "class": "ic icons icon arrow circle right"
    },
    "nodeName": "i",
    "parent": "#iconHolder"
  }, {
    "attributes": {
      "id": "readyArrow",
      "class": "chevron circle right icon"
    },
    "nodeName": "i",
    "parent": "#readyButton"
  }, {
    "attributes": {
      "id": "mask1"
    },
    "nodeName": "mask",
    "parent": "#videoCircle"
  }, {
    "attributes": {
      "id": "circleG",
      "mask": "url(#mask1)"
    },
    "nodeName": "g",
    "parent": "#videoCircle"
  }, {
    "attributes": {
      "x": "0",
      "y": "0",
      "width": "500",
      "height": "500",
      "fill": "white"
    },
    "nodeName": "rect",
    "parent": "#mask1"
  }, {
    "attributes": {
      "cx": "230",
      "cy": "180",
      "r": "130",
      "fill": "black"
    },
    "nodeName": "circle",
    "parent": "#mask1"
  }, {
    "attributes": {
      "id": "testSound",
      "cx": "230",
      "cy": "180",
      "r": "130",
      "fill": "#ffffff"
    },
    "nodeName": "circle",
    "parent": "#circleG"
  }];

  this.videoJsStructure = [{
      type: 'link',
      src: 'voiceItFront/voiceItJs/video.js/dist/video-js.min.css'
    },
    {
      type: 'script',
      src: 'voiceItFront/voiceItJs/video.js/dist/video.min.js'
    },
    {
      type: 'script',
      src: 'voiceItFront/voiceItJs/recordrtc/RecordRTC.js'
    },
    {
      type: 'script',
      src: 'voiceItFront/voiceItJs/videojs-record/dist/videojs.record.min.js'
    },
    {
      type: 'link',
      src: 'voiceItFront/voiceItJs/videojs-record/dist/css/videojs.record.css'
    },
    {
      type: 'script',
      src: 'voiceItFront/voiceItJs/wavesurfer.js/dist/wavesurfer.min.js'
    },
    {
      type: 'script',
      src: 'voiceItFront/voiceItJs/wavesurfer.js/dist/plugin/wavesurfer.microphone.min.js'
    },
    {
      type: 'script',
      src: 'voiceItFront/voiceItJs/videojs-wavesurfer/dist/videojs.wavesurfer.js'
    },
  ];

  this.scriptsStructure = [
    'voiceItFront/voiceItJs/jquery.min.js',
    'voiceItFront/voiceItJs/misc/bufferloader.js',
    'voiceItFront/voiceItJs/socket.io-client/dist/socket.io.js',
    'voiceItFront/voiceItJs/misc/bufferloader.js',
    'voiceItFront/semantic/dist/semantic.min.js',
    'voiceItFront/voiceItJs/webrtc-adapter/out/adapter.js',
    'voiceItFront/voiceItJs/misc/circle-progress.min.js',
    'voiceItFront/voiceItJs/prompts.js',
    'voiceItFront/voiceItJs/VoiceIt2Obj.js',
    'voiceItFront/voiceItJs/vudio.js',
    'voiceItFront/voiceItJs/liveness.js',
  ];

  this.linksStructure = [
    'https://fonts.googleapis.com/css?family=Roboto:400,100,300,700',
    'voiceItFront/semantic/dist/semantic.min.css',
    'voiceItFront/voiceItCss/style.css'
  ];

  this.svgElements = [
    'svg',
    'g',
    'mask',
    'circle',
    'rect'
  ];

  this.getmodalStructure = function() {
    return this.modalStructure;
  }

  this.getlinksStructure = function() {
    return this.linksStructure;
  }

  this.getscriptsStructure = function() {
    return this.scriptsStructure;
  }

  this.appendVideoJs = function(count) {
    if (count == this.videoJsStructure.length) {
      return;
    } else {
      if (this.videoJsStructure[count].type == 'link') {
        var link = document.createElement('link');
        link.type = 'text/css';
        link.href = this.videoJsStructure[count].src;
        link.rel = "stylesheet"
        document.head.appendChild(link);
      } else {
        var script = document.createElement('script');
        script.src = this.videoJsStructure[count].src;
        document.head.appendChild(script);
      }
      setTimeout(() => {
        return this.appendVideoJs(++count);
      }, 100);
    }
  }

  this.appendScripts = function(count){
    if (count == this.scriptsStructure.length) {
      return;
    } else {
      var timeOut = 50;
        var script = document.createElement('script');
        script.src = this.scriptsStructure[count];
        document.head.appendChild(script);
      setTimeout(() => {
        return this.appendScripts(++count);
      }, timeOut);
    }
  }

  this.appendModal = function() {
    var svgns = "http://www.w3.org/2000/svg";
    for (var i = 0; i < this.modalStructure.length; i++) {
      var ele;
      //svg elements require creation under different namespace
      if (this.svgElements.includes(this.modalStructure[i].nodeName)){
        ele = document.createElementNS(svgns,this.modalStructure[i].nodeName);
        ele = $(ele);
        ele.appendTo($(this.modalStructure[i].parent));
      }
      //all other non-svg elements
       else {
        ele = $('<' + this.modalStructure[i].nodeName + '/>').
        appendTo($(this.modalStructure[i].parent));
        if (this.modalStructure[i].text) {
          ele.text(this.modalStructure[i].text);
        }
      }
      for (var property in this.modalStructure[i].attributes) {
        ele.attr(property, this.modalStructure[i].attributes[property]);
      }
    }
  }

  this.init = function() {
    //append the link voiceIt dependecies to the DOM
    for (var j = 0; j < this.linksStructure.length; j++) {
      var link = document.createElement('link');
      link.type = 'text/css';
      link.href = this.linksStructure[j];
      link.rel = "stylesheet"
      document.head.appendChild(link);
    }

    //append the script voiceIt dependecies to the DOM
    this.appendScripts(0);

    //append video-js dependecies
    this.appendVideoJs(0);

    //append the Modal html to the DOM
    setTimeout(() => {
      this.appendModal();
    }, 500);
  }

  //TODO: destroy the modal, scripts, and links, from the DOM
  this.remove = function() {
  }
}
