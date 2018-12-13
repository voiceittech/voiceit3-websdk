import vi$ from './utilities';
import Prompts from './prompts';
import ProgressBar from 'progressbar.js';
import Vudio from './vudio';
import LoadingCircle from './vectors/loadingCircle.svg';
import LivenessTutorial from './vectors/livenessTutorial.svg';
import PoweredByBadge from './vectors/voiceit-powered-by-one-default.svg'
import { MAIN_THEME_COLOR } from './colors';

export default function Modal(mRef) {
  const VoiceItModalRef = this;
  const TIME_TO_READ_LIVENESS_TUTORIAL = 6000;
  const prompts = new Prompts();
  VoiceItModalRef.domRef = {};
  VoiceItModalRef.mainRef = mRef;
  // Array to keep track of cleanup functions
  VoiceItModalRef.cleanupFunctions = [];
  VoiceItModalRef.modalElementTree = [
    {
        'nodeName': 'div',
        'parent': 'body',
        'elName': 'modalDimBackground'
    },
    {
      'styles':{
        'display' : 'block !important',
        'max-width': '460px',
        'min-width': '460px',
        'overflow': 'hidden',
        'marginBottom': '8%',
        'background': 'transparent'
      },
      'attributes': {
        'class': 'ui modal viModal'
      },
      'elName': 'voiceItModal',
      'nodeName': 'div',
      'parent': 'modalDimBackground'
    }, {
      'attributes': {
        'class': 'close icon'
      },
      'styles': {
        'top': '1rem',
        'right': '1rem',
        'color': '#FFFFFF',
        'fontSize': '25px'
      },
      'nodeName': 'i',
      'elName' : 'closeButton',
      'parent': 'voiceItModal'
    }, {
      'styles':{
        'zIndex': '-2'
      },
      'attributes': {
        'class': 'ui card'
      },
      'elName':'viCard',
      'nodeName': 'div',
      'parent': 'voiceItModal'
    }, {
      'attributes': {
        'class': 'image',
      },
      'elName':'cardOverlay',
      'nodeName': 'div',
      'parent': 'viCard'
    },{
      'styles':{
        'bottom': '3.5em',
        'zIndex': '6',
        'position': 'relative',
        'padding': '0px',
        'backgroundColor': 'black',
        'textAlign': 'center'
      },
      'attributes': {
        'class': 'content'
      },
      'elName':'content',
      'nodeName': 'div',
      'parent': 'viCard'
    }, {
      'styles':{
        'backgroundColor': '#000000'
      },
      'attributes': {
        'class': 'extra content'
      },
      'nodeName': 'div',
      'elName':'modalExtraContent',
      'parent': 'viCard'
    },
    {
      'attributes': {
        'href':'https://voiceit.io',
        'target':'_blank'
      },
      'elName': 'poweredByLink',
      'nodeName': 'a',
      'parent': 'modalExtraContent'
    },
    {
      'styles':{
        'display': 'none',
        'width': '100%',
        'height': '345px',
        'position': 'absolute',
        'zIndex': '26',
        'background': 'black',
        'textAlign': 'center',
        'alignItems': 'center',
        'justifyContent': 'center',
        'flexWrap': 'wrap',
        'alignContent': 'center'
      },
      'nodeName': 'div',
      'elName':'warningOverlay',
      'parent': 'cardOverlay'
    },{
      'styles':{
        'display': 'none',
        'width': '100%',
        'height': '345px',
        'position': 'absolute',
        'zIndex': '26',
        'background': 'black',
        'textAlign': 'center',
        'alignItems': 'center',
        'justifyContent': 'center',
        'flexWrap': 'wrap',
        'alignContent': 'center'
      },
      'nodeName': 'div',
      'elName':'livenessOverlay',
      'parent': 'cardOverlay'
    },{
      'styles':{
        'overflow': 'hidden',
        'position': 'relative',
        'justifyContent': 'center',
        'display': 'flex',
        'minHeight': '365px',
        'width': '100%'
      },
      'nodeName': 'div',
      'elName':'overlayHolder',
      'parent': 'cardOverlay'
    }, {
      'attributes': {
        'id': 'videoLiveness',
        'autoplay': '',
        'playsinline': ''
      },
      'nodeName': 'video',
      'parent': 'cardOverlay'
    }, {
      'styles':{
        'color': '#2ECC71',
        'height': '2em'
      },
      'attributes':{
        'class':'ui header'
      },
      'elName': 'headerLink',
      'nodeName': 'a',
      'parent': 'content'
    }, {
      'attributes': {
        'id': 'powered-by',
        'src': PoweredByBadge
      },
      'nodeName': 'img',
      'parent': 'poweredByLink'
    },
    {
      'styles':{
        'color': 'white',
        'fontStyle': 'normal',
        'paddingTop':'5rem',
        'paddingLeft': '10px',
        'paddingRight': '10px',
        'fontSize': 'large',
        'width':'100%',
        'fontWeight': '300'
      },
      'attributes': {
        'class': 'ui header'
      },
      'elName':'warnText',
      'nodeName': 'span',
      'parent': 'warningOverlay',
      'text': prompts.getPrompt('REENROLLMENT_WARNING')
    }, {
      'nodeName': 'div',
      'elName': 'iconHolder',
      'parent': 'warningOverlay'
    },{
      'styles':{
        'marginBottom': '7%',
        'fontWeight': 'normal',
        'maxWidth': '80%',
        'color': 'white',
        'fontStyle': 'normal'
      },
      'elName': 'livenessText',
      'nodeName': 'h4',
      'parent': 'livenessOverlay',
      'text': prompts.getPrompt('LIVENESS_READY_PROMPT')
    }, {
      'styles':{
        'width': '70%'
      },
      'attributes': {
        'src': LivenessTutorial
      },
      'elName':'livenessTutorial',
      'nodeName': 'img',
      'parent': 'livenessOverlay'
    }, {
      'styles':{
        'color': '#000000',
        'position': 'absolute',
        'bottom': '0px'
      },
      'attributes': {
        'class': 'ui basic label'
      },
      'elName': 'skipButton',
      'nodeName': 'a',
      'parent': 'livenessOverlay',
      'text': 'Skip'
    }, {
      'styles':{
        'display': 'flex',
        'position': 'absolute',
        'minHeight': '345px',
        'width': '100%',
        'zIndex': '1',
        'background': 'rgba(0,0,0,0.7)'
      },
      'nodeName': 'div',
      'elName':'outerOverlay',
      'parent': 'overlayHolder'
    }, {
      'styles':{
        'position': 'absolute',
        'top': '6%',
        'zIndex' : '2'
      },
      'attributes': {
        'width': '460',
        'height': '345',
        'class': 'viCanvas'
      },
      'nodeName': 'canvas',
      'elName' : 'overlayCanvas',
      'parent': 'overlayHolder'
    }, {
      'attributes': {
        'class': 'small ui inverted basic button viReadyButton'
      },
      'styles': {
        'position': 'absolute',
        'bottom': '0%',
        'zIndex': '8',
        'margin': 'auto',
        'fontWeight' :'600'
      },
      'nodeName': 'button',
      'elName': 'readyButton',
      'parent': 'overlayHolder',
      'text': 'Click to begin'
    }, {
      'styles':{
        'top': '6%',
        'width': '100%',
        'position': 'absolute',
        'opacity':'0.0'
      },
      'attributes': {
        'class':'viImageCanvas',
        'height': '480',
        'width': '640'
      },
      'elName': 'imageCanvas',
      'nodeName': 'canvas',
      'parent': 'overlayHolder'
    },{
      'styles':{
        'fontStyle': 'normal',
        'maxWidth': '300px',
        'color': '#FFFFFF'
      },
      'elName':'viMessage',
      'nodeName': 'span',
      'parent': 'headerLink'
    },
    {
      'attributes': {
        'class': 'ic icon arrow circle left arrowButton'
      },
      'elName':'leftArrowIcon',
      'nodeName': 'i',
      'parent': 'iconHolder'
    }, {
      'attributes': {
        'class': 'ic icons icon arrow circle right arrowButton'
      },
      'elName': 'rightArrowIcon',
      'nodeName': 'i',
      'parent': 'iconHolder'
    }, {
      'attributes': {
        'class': 'chevron circle right icon'
      },
      'elName':'readyArrow',
      'nodeName': 'i',
      'parent': 'readyButton'
    }
  ];

  VoiceItModalRef.svgElements = ['svg', 'g', 'mask', 'circle', 'rect'];

  VoiceItModalRef.getmodalElementTree = function() {
    return VoiceItModalRef.modalElementTree;
  }

  VoiceItModalRef.buildModal = function() {
    var svgns = "http://www.w3.org/2000/svg";
    VoiceItModalRef.modalElementTree.forEach(function(modalPart) {
      var ele;
      //  Svg elements require creation under different namespace
      if (VoiceItModalRef.svgElements.indexOf(modalPart.nodeName) > -1) {
        ele = document.createElementNS(svgns, modalPart.nodeName);
        var parent = vi$.qs(modalPart.parent);
        if(!parent){ parent = VoiceItModalRef.domRef[modalPart.parent]; }
        parent.appendChild(ele);
      } else {
        ele = document.createElement(modalPart.nodeName);
        var parent = vi$.qs(modalPart.parent);
        if(parent == undefined){
          parent = VoiceItModalRef.domRef[modalPart.parent];
        }
        parent.appendChild(ele);
        if (modalPart.text) {
          ele.textContent = modalPart.text;
        }
      }
      if(modalPart['elName']){
        VoiceItModalRef.domRef[modalPart['elName']] = ele;
      }
      for (var property in modalPart.attributes) {
        ele.setAttribute(property, modalPart.attributes[property]);
      }
      for (var property in modalPart.styles) {
        ele.style[property] = modalPart.styles[property];
      }
    });
  }

  VoiceItModalRef.show = function(){
    VoiceItModalRef.domRef.modalDimBackground.className = 'ui dimmer modals page transition visible active';
    VoiceItModalRef.domRef.voiceItModal.className = 'viModal ui modal transition visible active';
  }

  VoiceItModalRef.hide = function(){
    VoiceItModalRef.domRef.modalDimBackground.className = '';
    VoiceItModalRef.domRef.voiceItModal.className = 'viModal ui modal';
    VoiceItModalRef.domRef.modalDimBackground.style.opacity = 1.0;
    VoiceItModalRef.domRef.voiceItModal.style.opacity = 1.0;
  }

  VoiceItModalRef.build = function() {
    VoiceItModalRef.destroy();
    VoiceItModalRef.buildModal();
  }

  // Circle Helper Methods
  VoiceItModalRef.hideProgressCircle = function(duration, after){
    if(!VoiceItModalRef.domRef.progressCircle){ return; }
    if(duration){
      vi$.fadeOut(VoiceItModalRef.domRef.progressCircle, duration, after);
    } else {
      VoiceItModalRef.domRef.progressCircle.style.opacity = 0.0;
    }
  }

  VoiceItModalRef.revealProgressCircle = function(duration, after){
    if(!VoiceItModalRef.domRef.progressCircle){ return; }
    if(duration){
      vi$.fadeIn(VoiceItModalRef.domRef.progressCircle, duration, after);
    } else {
      VoiceItModalRef.domRef.progressCircle.style.opacity = 1.0;
    }
  }

  VoiceItModalRef.createProgressCircle = function(animationDuration){
    if(VoiceItModalRef.domRef.progressCircle){
      vi$.remove(VoiceItModalRef.domRef.progressCircle);
    }
    VoiceItModalRef.domRef.progressCircle = vi$.create('div');
    var progressCircleProps = {
      'styles':{
        'zIndex': '12',
        'top': '10.5%',
        'position': 'absolute',
        'width': '271px',
        'height': '271px',
        'left': '21%'
      },
      'attributes':{
        'class':'viProgressCircle'
      },
    };
    for (var prop in progressCircleProps.attributes) {
      VoiceItModalRef.domRef.progressCircle.setAttribute(prop, progressCircleProps.attributes[prop]);
    }
    for (var prop in progressCircleProps.styles) {
      VoiceItModalRef.domRef.progressCircle.style[prop] = progressCircleProps.styles[prop];
    }
    VoiceItModalRef.domRef.overlayHolder.insertBefore(VoiceItModalRef.domRef.progressCircle, VoiceItModalRef.domRef.imageCanvas);
    vi$.createProgressCircle(VoiceItModalRef.domRef.progressCircle, animationDuration);
  }

  VoiceItModalRef.createLivenessCircle = function(animationDuration){
    if(VoiceItModalRef.domRef.progressCircle){
      vi$.remove(VoiceItModalRef.domRef.progressCircle);
    }
    VoiceItModalRef.domRef.progressCircle = vi$.create('div');
    var progressCircleProps = {
      'styles':{
        'zIndex': '12',
        'top': '10.5%',
        'position': 'absolute',
        'width': '271px',
        'height': '271px',
        'left': '21%'
      },
      'attributes':{
        'class':'viProgressCircle'
      },
    };
    for (var prop in progressCircleProps.attributes) {
      VoiceItModalRef.domRef.progressCircle.setAttribute(prop, progressCircleProps.attributes[prop]);
    }
    for (var prop in progressCircleProps.styles) {
      VoiceItModalRef.domRef.progressCircle.style[prop] = progressCircleProps.styles[prop];
    }
    VoiceItModalRef.domRef.overlayHolder.insertBefore(VoiceItModalRef.domRef.progressCircle, VoiceItModalRef.domRef.imageCanvas);
    VoiceItModalRef.livenessCircleInstance = new ProgressBar.Circle(VoiceItModalRef.domRef.progressCircle, {
      strokeWidth: 3,
      easing: 'easeInOut',
      color: MAIN_THEME_COLOR,
      trailColor: 'rgba(0,0,0,0.0)',
      trailWidth: 0,
      svgStyle: null
    });
    VoiceItModalRef.livenessCircleInstance.set(1.0);
  }

  VoiceItModalRef.updateProgressCircle = function(circleId, value, color){
    VoiceItModalRef.livenessCircleInstance.path.setAttribute('stroke', color);
    VoiceItModalRef.livenessCircleInstance.set(value);
  }

  // Create the Audio waveform
  VoiceItModalRef.createWaveform = function() {
    if(VoiceItModalRef.domRef.waveform){
      vi$.remove(VoiceItModalRef.domRef.waveform);
    }
    VoiceItModalRef.domRef.waveform = vi$.create('canvas');
    var waveProps = {
      'styles':{
        'position': 'absolute',
        'top': '8%',
        'right': '0',
        'bottom': '0',
        'zIndex': '2',
        'backgroundColor': 'black',
        'opacity': '0.3'
      },
      'attributes':{
        'height':'242',
        'width' :'460',
        'class' :'viWaveform'
      }
    };
    for (var prop in waveProps.attributes) {
      VoiceItModalRef.domRef.waveform.setAttribute(prop, waveProps.attributes[prop]);
    }
    for (var prop in waveProps.styles) {
      VoiceItModalRef.domRef.waveform.style[prop] = waveProps.styles[prop];
    }
    VoiceItModalRef.domRef.viCard.insertBefore(VoiceItModalRef.domRef.waveform, VoiceItModalRef.domRef.content);
    // var colors = ['#fb6d6b', '#c10056', ' #a50053', '#51074b'];
    var colors = [MAIN_THEME_COLOR, MAIN_THEME_COLOR, MAIN_THEME_COLOR, MAIN_THEME_COLOR];//['#F7C959','#FBC132','#E4B237','#FBC43C'];
    VoiceItModalRef.audioVisualizer = new Vudio(VoiceItModalRef.domRef.waveform, {
      effect: 'waveform',
      accuracy: 512,
      width: 512,
      height: 300,
      waveform: {
        maxHeight: 200,
        color: colors
      }
    });
  }

  VoiceItModalRef.revealWaveform = function(duration, after){
    if(!VoiceItModalRef.domRef.waveform){ return; }
    if(duration){
      vi$.fadeIn(VoiceItModalRef.domRef.waveform, duration, after);
    } else {
      VoiceItModalRef.domRef.waveform.style.opacity = 1.0;
    }
  }

  // Header Helper Methods
  VoiceItModalRef.hideWarningOverlay = function(duration, after){
    if(!VoiceItModalRef.domRef.warningOverlay){ return; }
    if(duration){
      var tempAfter = function(){
        VoiceItModalRef.domRef.warningOverlay.style.display = 'none';
        vi$.remove(VoiceItModalRef.domRef.warningOverlay);
        if(after){ VoiceItModalRef.removeWaitingLoader(); after(); }
      }
      vi$.fadeOut(VoiceItModalRef.domRef.warningOverlay, duration, tempAfter);
    } else {
      VoiceItModalRef.domRef.warningOverlay.style.opacity = 0.0;
      VoiceItModalRef.domRef.warningOverlay.style.display = 'none';
      vi$.remove(VoiceItModalRef.domRef.warningOverlay);
    }
  }

  VoiceItModalRef.endLivenessTutorial = function(){
    vi$.fadeOut(VoiceItModalRef.domRef.livenessOverlay, 400, function() {
      VoiceItModalRef.domRef.readyButton.style.display = 'inline-block';
      vi$.fadeIn(VoiceItModalRef.domRef.readyButton, 300);
      vi$.remove(VoiceItModalRef.domRef.livenessOverlay);
      VoiceItModalRef.domRef.imageCanvas.style.opacity = 1.0;
    });
  }

  // TODO: Refactor this to a createOverlay method
  VoiceItModalRef.revealLivenessOverlay = function(){
    if(!VoiceItModalRef.domRef.livenessOverlay){ return; }
    VoiceItModalRef.domRef.livenessOverlay.style.opacity = 1.0;
    VoiceItModalRef.domRef.livenessOverlay.style.display = 'inline-flex';
    VoiceItModalRef.domRef.livenessText.style.display = '';
    vi$.delay(TIME_TO_READ_LIVENESS_TUTORIAL, function(){
      VoiceItModalRef.endLivenessTutorial();
    })
  }

  VoiceItModalRef.revealWarningOverlay = function(duration, after){
    if(!VoiceItModalRef.domRef.warningOverlay){ return; }
    if(duration){
      VoiceItModalRef.domRef.warningOverlay.style.display = 'inline-flex';
      vi$.fadeIn(VoiceItModalRef.domRef.warningOverlay, duration, after);
    } else {
      VoiceItModalRef.domRef.warningOverlay.style.opacity = 1.0;
      VoiceItModalRef.domRef.warningOverlay.style.display = 'inline-flex';
    }
  }

  VoiceItModalRef.displayMessage = function(textToSet){
    if(!VoiceItModalRef.domRef.viMessage){ return; }
    VoiceItModalRef.domRef.viMessage.innerHTML = textToSet;
    VoiceItModalRef.domRef.viMessage.style.opacity = 1.0;
    VoiceItModalRef.domRef.viMessage.style.display = 'inline-block';
  }

  VoiceItModalRef.showWaitingLoader = function(down){
        if(VoiceItModalRef.domRef.waitingLoader){
          vi$.remove(VoiceItModalRef.domRef.waitingLoader);
        }
        // Hide any visible text while showing the waiting loader
        VoiceItModalRef.domRef.viMessage.style.opacity = 0.0;
        VoiceItModalRef.domRef.viMessage.style.display = 'none';
        VoiceItModalRef.domRef.waitingLoader = vi$.create('div');
        VoiceItModalRef.domRef.waitingLoader.style.display = 'flex';
        VoiceItModalRef.domRef.waitingLoader.style.justifyContent = 'center';
        var waitingLoaderImg = vi$.create('img');
        VoiceItModalRef.domRef.waitingLoader.appendChild(waitingLoaderImg);
        var waitingLoaderProps = {
          'styles':{
            'display':'flex !important',
            'top': down ? '88%': '44%',
            'position': 'absolute',
            'zIndex': '18',
            'maxHeight': '4rem'
          },
          'attributes': {
            'class': 'svg',
            'src': LoadingCircle
          }
        };

        for (var prop in waitingLoaderProps.attributes) {
          waitingLoaderImg.setAttribute(prop, waitingLoaderProps.attributes[prop]);
        }
        for (var prop in waitingLoaderProps.styles) {
          waitingLoaderImg.style[prop] = waitingLoaderProps.styles[prop];
        }
        VoiceItModalRef.domRef.overlayHolder.insertBefore(VoiceItModalRef.domRef.waitingLoader, VoiceItModalRef.domRef.firstChild);
  }

  VoiceItModalRef.removeWaitingLoader = function(){
      if(VoiceItModalRef.domRef.waitingLoader){
        vi$.remove(VoiceItModalRef.domRef.waitingLoader);
      }
  }

  // Creates the circular audio waveform around video (verification/enrollment)
  VoiceItModalRef.createVideoCircle = function() {
    if(VoiceItModalRef.domRef.videoCircle){
      vi$.remove(VoiceItModalRef.domRef.videoCircle);
    }
    var videoCircleRadius = 130;
    var svgNS = "http://www.w3.org/2000/svg";
    VoiceItModalRef.domRef.videoCircle = document.createElementNS(svgNS, "svg");
    var vidCircleProps = {
        'styles':{
          'right': '-1.5%',
          'position': 'absolute',
          'zIndex': '11',
          'top': '-2.3%',
          'opacity': '0.0'
        },
        'attributes': {
          'height': '460',
          'width': '465'
        }
    };
    for (var prop in vidCircleProps.attributes) {
      VoiceItModalRef.domRef.videoCircle.setAttribute(prop, vidCircleProps.attributes[prop]);
    }
    for (var prop in vidCircleProps.styles) {
      VoiceItModalRef.domRef.videoCircle.style[prop] = vidCircleProps.styles[prop];
    }
    var circleMask = document.createElementNS(svgNS, "mask");
    circleMask.setAttribute('id', 'viCircleMask');
    var whiteRectangle = document.createElementNS(svgNS, "rect");
    var rectAttrs =
    {
        'x': '0',
        'y': '0',
        'width': '500',
        'height': '500',
        'fill': 'white'
    };
    for (var prop in rectAttrs) {
      whiteRectangle.setAttribute(prop, rectAttrs[prop]);
    }
    circleMask.appendChild(whiteRectangle);
    var innerBlackCircle = document.createElementNS(svgNS, "circle");
    var blackCircleAttrs =
    {
        'cx': '230',
        'cy': '180',
        'r': videoCircleRadius,
        'fill': 'black'
    };
    for (var prop in blackCircleAttrs) {
      innerBlackCircle.setAttribute(prop, blackCircleAttrs[prop]);
    }
    circleMask.appendChild(innerBlackCircle);
    VoiceItModalRef.domRef.videoCircle.appendChild(circleMask);
    var circleGroup = document.createElementNS(svgNS, "g");
    circleGroup.setAttribute('mask', 'url(#viCircleMask)');
    var soundCircle = document.createElementNS(svgNS, "circle");
    soundCircle.style.opacity = '1.0';
    soundCircle.style.zIndex = '13';
    var soundCircleAttrs =
    {
        'cx': '230',
        'cy': '180',
        'r': videoCircleRadius,
        'fill': '#FFFFFF'
    };
    for (var prop in soundCircleAttrs) {
      soundCircle.setAttribute(prop, soundCircleAttrs[prop]);
    }
    circleGroup.appendChild(soundCircle);

    VoiceItModalRef.domRef.videoCircle.appendChild(circleGroup);
    VoiceItModalRef.domRef.overlayHolder.insertBefore(VoiceItModalRef.domRef.videoCircle, VoiceItModalRef.domRef.overlayHolder.firstChild);
    var analyser;
    var amp;
    var animationId;
    navigator.mediaDevices.getUserMedia({
        audio: true,
        video: false
    }).then(function(stream) {
        var context = new AudioContext();
        analyser = context.createAnalyser();
        analyser.smoothingTimeConstant = 0.85;
        context.createMediaStreamSource(stream).connect(analyser);
        analyser.minDecibels = -95;
        amp = new Uint8Array(analyser.frequencyBinCount);
        VoiceItModalRef.videoCircleStream = stream;
        function drawSoundCircle() {
          analyser.getByteFrequencyData(amp);
          var vol = vi$.getRMS(amp);
          var soundCircleRadius = (vol / 3) + videoCircleRadius;
          soundCircle.setAttribute('r', soundCircleRadius);
          animationId = window.requestAnimationFrame(drawSoundCircle);
        }
        animationId = window.requestAnimationFrame(drawSoundCircle);
        // Add animation to cleanup array
        VoiceItModalRef.cleanupFunctions.push(function(){
          window.cancelAnimationFrame(animationId);
        });
    }).catch(function(err) {
        console.log("error : " + err);
    });
    vi$.fadeIn(VoiceItModalRef.domRef.videoCircle, 500);
  }

  VoiceItModalRef.showEnrollmentDeletionWarningOverlay = function() {
    VoiceItModalRef.domRef.warningOverlay.style.display = 'flex';
    VoiceItModalRef.domRef.readyButton.style.display = 'none';
    VoiceItModalRef.domRef.readyButton.style.opacity = 0;
    VoiceItModalRef.domRef.imageCanvas.style.opacity = 0.0;
  };

  VoiceItModalRef.destroy = function() {
    VoiceItModalRef.removeWaitingLoader();
    while(VoiceItModalRef.cleanupFunctions.length != 0){
      VoiceItModalRef.cleanupFunctions.shift()();
    }
    if (VoiceItModalRef.audioVisualizer !== null && VoiceItModalRef.audioVisualizer !== undefined && VoiceItModalRef.audioVisualizer.getStream() !== undefined) {
      VoiceItModalRef.audioVisualizer.getStream().getTracks()[0].stop();
      for (var key in VoiceItModalRef.audioVisualizer.audioVisualizer){
        VoiceItModalRef.audioVisualizer.audioVisualizer[key] = null;
        delete voiceIt2ObjRef.audioVisualizer[key];
      }
      VoiceItModalRef.audioVisualizer = null;
    }
    if (VoiceItModalRef.videoCircleStream !== undefined) {
      VoiceItModalRef.videoCircleStream.getTracks()[0].stop();
      VoiceItModalRef.videoCircleStream = undefined;
    }
    vi$.remove(VoiceItModalRef.domRef.modalDimBackground);
  }

  VoiceItModalRef.showTokenErrorAndDestroy = function(mainRef){
    VoiceItModalRef.build();
    VoiceItModalRef.show();
    VoiceItModalRef.domRef.viCard.innerHTML = '';
    VoiceItModalRef.domRef.viCard.style.backgroundColor = 'red';
    VoiceItModalRef.domRef.viCard.style.minHeight = '400px';
    var content = vi$.create('div');
    content.style.bottom = '3.5em';
    content.style.position = 'relative';
    content.style.padding = '0px';
    content.style.backgroundColor = 'red';
    content.style.textAlign = 'center';
    content.setAttribute('class', 'content');
    var message = vi$.create('p');
    message.style.paddingTop = '200px';
    message.style.color = '#FFFFFF';
    message.setAttribute('class','ui header');
    message.innerHTML = 'Access Denied! Invalid secure token detected.<br/>Please contact support.';
    content.appendChild(message);
    VoiceItModalRef.domRef.viCard.appendChild(content);
    vi$.delay(2000, function(){
      vi$.fadeOut(VoiceItModalRef.domRef.modalDimBackground, 1100, function(){
        VoiceItModalRef.mainRef.destroy();
      });
    });
  }

}
