function Liveness() {

  var manyfaces = false;

  var brfv4WASMBuffer = null;

  var brfv4SDKName = "BRFv4_JS_TK190218_v4.0.5_trial";

  var _isWebAssemblySupported = (function() {

    function testSafariWebAssemblyBug() {

      var bin   = new Uint8Array([0,97,115,109,1,0,0,0,1,6,1,96,1,127,1,127,3,2,1,0,5,3,1,0,1,7,8,1,4,116,101,115,116,0,0,10,16,1,14,0,32,0,65,1,54,2,0,32,0,40,2,0,11]);
      var mod   = new WebAssembly.Module(bin);
      var inst  = new WebAssembly.Instance(mod, {});

      // test storing to and loading from a non-zero location via a parameter.
      // Safari on iOS 11.2.5 returns 0 unexpectedly at non-zero locations

      return (inst.exports.test(4) !== 0);
    }

    var isWebAssemblySupported = (typeof WebAssembly === 'object');

    if(isWebAssemblySupported && !testSafariWebAssemblyBug()) {
      isWebAssemblySupported = false;
    }

    return isWebAssemblySupported;
  })();

  this.brfv4Example = {
    stats: {}
  };
  this.livPrompts = new prompts();
  this.cancel = false;
	this.stopped = false;
  //this.hidden = true;

  this.brfv4BaseURL = _isWebAssemblySupported ? "voiceItFront/voiceItJs/brf-js/libs/brf_wasm/" : "voiceItFront/voiceItJs/brf-js/libs/brf_asmjs/";
  this.support = (typeof WebAssembly === 'object');
  this.oldCircles = [];
  this.socket;
  this.setup = false;

  this.webcam = document.getElementById("myVideo"); // our this.webcam video
  this.imageData = document.getElementById("imageData"); // image data for BRFv4
  this.imageDataCtx = this.imageData.getContext('2d');
  this.brfv4 = null;
  this.brfmanager = undefined;
  this.resolution = null;
  this.test;

  var main = this;

  if (main.support) {
    function testSafariWebAssemblyBug() {
      var bin = new Uint8Array([0, 97, 115, 109, 1, 0, 0, 0, 1, 6, 1, 96, 1, 127, 1, 127, 3, 2, 1, 0, 5, 3, 1, 0, 1, 7, 8, 1, 4, 116, 101, 115, 116, 0, 0, 10, 16, 1, 14, 0, 32, 0, 65, 1, 54, 2, 0, 32, 0, 40, 2, 0, 11]);
      var mod = new WebAssembly.Module(bin);
      var inst = new WebAssembly.Instance(mod, {});
      return (inst.exports.test(4) !== 0);
    }
    if (!testSafariWebAssemblyBug()) {
      main.support = false;
    }
  }

  function addBRFScript() {
    var script = document.createElement("script");
    script.setAttribute("type", "text/javascript");
    script.setAttribute("async", true);
    script.setAttribute("src", main.brfv4BaseURL + brfv4SDKName + ".js");
    document.getElementsByTagName("head")[0].appendChild(script);
  }

  // var script = document.createElement("script");
  // script.setAttribute("type", "text/javascript");
  // script.setAttribute("async", true);
  // script.setAttribute("src", main.brfv4BaseURL + "BRFv4_JS_TK190218_v4.0.5_trial.js");
  // document.getElementsByTagName("head")[0].appendChild(script);

  this.init = function(type) {
    main.cancel = false;
    if (main.brfv4Example.stats.init) {
      main.brfv4Example.stats.init(60);
    }
    main.waitForBRF();
  }

	this.doingLiveness = function () {
		return main.stopped;
	}

  this.waitForBRF = function() {

    if (main.brfv4 === null && window.hasOwnProperty("initializeBRF")) {
      main.brfv4 = {
        locateFile: function(fileName) {
          return main.brfv4BaseURL + fileName;
        },
        wasmBinary: brfv4WASMBuffer
      };
        initializeBRF(main.brfv4);
    }

    if (main.brfv4 && main.brfv4.sdkReady) {
      main.initSDK();
    } else {
      setTimeout(main.waitForBRF, 100);
    }
  }

  function tooManyFaces() {
    $('#overlay2').fadeTo(200, 1.0);
    $('#header').fadeTo(200, 0, function() {
      $(this).text("Please make sure there is only one face in the camera view");
      $('#header').fadeTo(200, 1.0);
    });
  }

  function singleface() {
    $('#overlay2').fadeTo(200, 1.0);
  }

  this.initSDK = function() {
    main.resolution = new main.brfv4.Rectangle(0, 0, main.imageData.width, main.imageData.height);
    main.brfmanager = new main.brfv4.BRFManager();
    main.brfmanager.init(main.resolution, main.resolution, "vocieitBRFTracking");
    console.log(main.resolution);
		main.assignSocketEvents();
    setTimeout(()=>{
      main.trackfaces();
    },200);
  }

  this.assignSocketEvents = function() {
    main.socket = io.connect('/', {
      reconnection: true,
      reconnectionDelay: 1,
      randomizationFactor: 0,
      reconnectionDelayMax: 1,
      transports: ['websocket'],
      secure: true,
      forceNew: true
    });
    main.socket.on('initiated', function(s) {
      main.test = s;
      main.createLivenessCircle();
      main.drawCircle(main.test);
    });
    main.socket.on('test', function(test) {
			if (main.cancel){
				main.cancel = false;
				//main.trackfaces();
			}
      main.redrawCircle(test);
    });
    main.socket.on('reTest', function(test) {
			setTimeout(()=>{
				$('#circle').css('display', 'block');
				main.redrawCircle(test);
				setTimeout(function() {
					$('#overlay2').fadeTo(300, 0.3);
				}, 300);
			},200);
    });
    main.socket.on('completeLiveness', function(code) {
      switch (code) {
        case 7:
				main.cancel = true;
				//show waiting, post liveness success
          $('#circle').circleProgress({
            value: main.oldCircles[0],
            fill: {
              color: "#FBC132"
            },
            animation: false
          });
          $('#circle > canvas').css('transform', main.oldCircles[1]);
          break;
        case 6:
				main.cancel = true;
				//show waiting, ready to start video verification post liveness success
          $('#circle').circleProgress({
            value: main.oldCircles[0],
            fill: {
              color: "#FBC132"
            },
            animation: false
          });
          $('#circle > canvas').css('transform', main.oldCircles[1]);
          setTimeout(function() {
            $('#circle').fadeTo(300, 0.0, function() {
              $('#circle').css('display', 'none');
            });
          }, 300);
          break;
        case 4:
          //show waiting for response, passed liveness tests
          $('#circle').circleProgress({
            value: main.oldCircles[0],
            fill: {
              color: "#FBC132"
            },
            animation: false
          });
          $('#circle > canvas').css('transform', main.oldCircles[1]);
          setTimeout(function() {
            $('#circle').fadeTo(300, 0.0, function() {
              $('#circle').css('display', 'none');
            });
          }, 300);
          $('#overlay2').fadeTo(300, 1.0);
          $('#header').fadeTo(300, 0, function() {
            $('#header').css('display', 'none');
            $('#wait').css('display', 'inline-block');
            $('#wait').css('opacity', '0');
            $('#wait').fadeTo(300, 1.0);
          });
					main.cancel = true;
          break;
        case 3:
          //passed liveness and face identification
          $('#header').text(main.livPrompts.getPrompt("LIVENESS_SUCCESS"));
					setTimeout(()=> {
						$('#wait').fadeTo(300, 0.0, function() {
							$(this).css('display', 'none');
							$('#header').css('display', 'inline-block');
							$('#header').fadeTo(300, 1.0);
						});
					},200);
					if (!main.stopped){
					main.stop();
					}
					//main.exitOut();
          break;
        case 2:
          //failed verification, but passed liveness
				  $('#header').text(main.livPrompts.getPrompt("LIVENESS_FAILED"));
          $('#wait').fadeTo(300, 0.0, function() {
            $('#wait').css('display', 'none');
            $('#header').css('display', 'inline-block');
            $('#header').fadeTo(300, 1.0);
          });
					if (!main.stopped){
					main.stop();
					}
					//main.exitOut();
          break;
				//failed a right, left, down test
				case 1.5:
				$('#circle').fadeTo(300, 0.0, function() {
					$(this).css('display', 'none');
				});
				$('#overlay2').fadeTo(300, 1.0);
				$('#header').fadeTo(300, 0, function() {
					$(this).text(main.livPrompts.getPrompt("LIVENESS_TRY_AGAIN_AND_TURN_BACK"));
					$('#header').fadeTo(300, 1.0);
				});
				break;
        case 1:
          //failed, give more tries
          $('#circle').fadeTo(300, 0.0, function() {
            $(this).css('display', 'none');
          });
          $('#overlay2').fadeTo(300, 1.0);
          $('#header').fadeTo(300, 0, function() {
            $(this).text(main.livPrompts.getPrompt("LIVENESS_TRY_AGAIN"));
            $('#header').fadeTo(300, 1.0);
          });
          break;
        case 0:
          //failed liveness
          $('#wait').css('display', 'none');
          $('#circle').fadeTo(300, 0.0, function() {
            $(this).css('display', 'none');
          });
          $('#overlay2').fadeTo(300, 1.0);
          $('#header').fadeTo(300, 0, function() {
            $(this).text(main.livPrompts.getPrompt("LIVENESS_FAILED"));
            $('#header').fadeTo(300, 1.0);
          });
					if (!main.stopped){
					main.stop();
					}
					//main.exitOut();
          break;
        default:
      }
    });
		// $('#readyButton').click(
		// 	function() {
		// 	main.hidden = false;
		// });
  }

  this.trackfaces = function() {
    if (main.brfv4Example.stats.start) {
      main.brfv4Example.stats.start();
    }
    main.brfmanager.update(main.imageDataCtx.getImageData(0, 0, main.resolution.width, main.resolution.height).data);
    var faces = main.brfmanager.getFaces();
    var face = faces[0];
    console.log(face.rotationX);
    main.socket.emit('data', face);
    if (main.brfv4Example.stats.end) {
      main.brfv4Example.stats.end();
    }
    if (!main.cancel){
      animationId = window.requestAnimationFrame(main.trackfaces);
    }
  }

  this.stop = () => {
		main.stopped = true;
		main.socket.emit('terminateLiveness',1);
    main.cancel = true;
    window.cancelAnimationFrame(animationId);
		setTimeout(()=>{
			main.brfv4Example = null;
      delete main.brfv4Example;
			main.oldCircles = null;
      delete 	main.oldCircle;
	    main.webcam = null;
      delete main.webcam;
	    main.imageData =null;
      delete main.imageData;
	    main.imageDataCtx = null;
      delete main.imageDataCtx;
	    main.brfv4 = null;
      delete main.brfv4;
	    main.brfmanager = null;
      delete main.brfmanager;
	    main.resolution = null;
      delete main.resolution;
	    main.test = null;
      delete main.test;
		},50);
  }

  this.resume = function() {
    main.assignSocketEvents();
    main.stop = false;
    main.setup = true;
    main.cancel = false;
    main.trackfaces();
  }

  this.createLivenessCircle = function() {
    $('#circle').circleProgress({
      value: 0.25,
      size: 268,
      fill: {
        color: "#ffb602"
      },
      startAngle: Math.PI / 4,
      thickness: 5,
      lineCap: "round",
      emptyFill: 'rgba(0,0,0,0)',
      animation: false
    });
  }

  this.drawCircle = function(int) {
    switch (int) {
      case 0:
        $('#header').css('opacity', '0.0');
        $('#header').text(main.livPrompts.getPrompt('FACE_DOWN'));
        $('#header').fadeTo(500, 1.0);
        $('#circle').css('opacity', '0.0');
        $('#circle').circleProgress({
          value: 0.25,
          fill: {
            color: "#ffffff"
          },
          animation: false
        });
        $('#circle > canvas').css('transform', 'rotate(0deg)');
        main.oldCircles[0] = 0.25;
        main.oldCircles[1] = 'rotate(0deg)';
        break;
      case 1:
        $('#header').css('opacity', '0.0');
        $('#header').text(main.livPrompts.getPrompt('FACE_RIGHT'));
        $('#header').fadeTo(500, 1.0);
        $('#circle').css('opacity', '0.0');
        $('#circle').circleProgress({
          value: 0.25,
          fill: {
            color: "#ffffff"
          },
          animation: false
        });
        $('#circle > canvas').css('transform', 'rotate(-90deg)');
        main.oldCircles[0] = 0.25;
        main.oldCircles[1] = 'rotate(-90deg)';
        break;
      case 2:
        $('#header').css('opacity', '0.0');
        $('#header').text(main.livPrompts.getPrompt('FACE_LEFT'));
        $('#header').fadeTo(500, 1.0);
        $('#circle').css('opacity', '0.0');
        $('#circle').circleProgress({
          value: 0.25,
          fill: {
            color: "#ffffff"
          },
          animation: false
        });
        $('#circle > canvas').css('transform', 'rotate(90deg)');
        main.oldCircles[0] = 0.25;
        main.oldCircles[1] = 'rotate(90deg)';
        break;
      case 3:
        $('#header').css('opacity', '0.0');
        $('#header').text(main.livPrompts.getPrompt('SMILE'));
        $('#header').fadeTo(500, 1.0);
        $('#circle').css('opacity', '0.0');
        $('#circle').circleProgress({
          value: 1.0,
          fill: {
            color: "#ffffff"
          },
          animation: false
        });
        $('#circle > canvas').css('transform', 'rotate(0deg)');
        main.oldCircles[0] = 1.0;
        main.oldCircles[1] = 'rotate(0deg)';
        break;
      case 4:
        $('#header').css('opacity', '0.0');
        $('#header').text(main.livPrompts.getPrompt('YAWN'));
        $('#header').fadeTo(500, 1.0);
        $('#circle').css('opacity', '0.0');
        $('#circle').circleProgress({
          value: 1.0,
          fill: {
            color: "#ffffff"
          },
          animation: false
        });
        $('#circle > canvas').css('transform', 'rotate(0deg)');
        main.oldCircles[0] = 1.0;
        main.oldCircles[1] = 'rotate(0deg)';
        break;
      default:
    }
  }

  this.redrawCircle = function(int) {
    switch (int) {
      case 0:
        $('#circle').circleProgress({
          value: main.oldCircles[0],
          fill: {
            color: "#FBC132"
          },
          animation: false
        });
        $('#circle > canvas').css('transform', main.oldCircles[1]);
        setTimeout(function() {
          $('#header').fadeTo(250, 0.0, function() {
            $('#header').text(main.livPrompts.getPrompt('FACE_DOWN'));
          });
          $('#header').fadeTo(500, 1.0);
          $('#circle').fadeTo(300, 0.0, function() {
            $('#circle').circleProgress({
              value: 0.25,
              fill: {
                color: "#ffffff"
              },
              animation: false
            });
            $('#circle > canvas').css('transform', 'rotate(0deg)');
            $('#circle').css('opacity', 1.0);
            main.oldCircles[0] = 0.25;
            main.oldCircles[1] = 'rotate(0deg)';
            $('#circle').fadeTo(300, 1.0);
          });
        }, 300);
        break;
      case 1:
        $('#circle').circleProgress({
          value: main.oldCircles[0],
          fill: {
            color: "#FBC132"
          },
          animation: false
        });
        $('#circle > canvas').css('transform', main.oldCircles[1]);
        setTimeout(function() {
          $('#header').fadeTo(250, 0.0, function() {
            $('#header').text(main.livPrompts.getPrompt('FACE_RIGHT'));
          });
          $('#header').fadeTo(500, 1.0);
          $('#circle').fadeTo(300, 0.0, function() {
            $('#circle').circleProgress({
              value: 0.25,
              fill: {
                color: "#ffffff"
              },
              animation: false
            });
            $('#circle > canvas').css('transform', 'rotate(-90deg)');
            main.oldCircles[0] = 0.25;
            main.oldCircles[1] = 'rotate(-90deg)';
            $('#circle').fadeTo(300, 1.0);
          });
        }, 300);
        break;
      case 2:
        $('#circle').circleProgress({
          value: main.oldCircles[0],
          fill: {
            color: "#FBC132"
          },
          animation: false
        });
        $('#circle > canvas').css('transform', main.oldCircles[1]);
        setTimeout(function() {
          $('#header').fadeTo(250, 0.0, function() {
            $('#header').text(main.livPrompts.getPrompt('FACE_LEFT'));
          });
          $('#header').fadeTo(500, 1.0);
          $('#circle').fadeTo(300, 0.0, function() {
            $('#circle').circleProgress({
              value: 0.25,
              fill: {
                color: "#ffffff"
              },
              animation: false
            });
            $('#circle > canvas').css('transform', 'rotate(90deg)');
            main.oldCircles[0] = 0.25;
            main.oldCircles[1] = 'rotate(90deg)';
            $('#circle').fadeTo(300, 1.0);
          });
        }, 300);
        break;
      case 3:
        $('#circle').circleProgress({
          value: main.oldCircles[0],
          fill: {
            color: "#FBC132"
          },
          animation: false
        });
        $('#circle > canvas').css('transform', main.oldCircles[1]);
        setTimeout(function() {
          $('#header').fadeTo(250, 0.0, function() {
            $('#header').text(main.livPrompts.getPrompt('SMILE'));
          });
          $('#header').fadeTo(500, 1.0);
          $('#circle').fadeTo(300, 0.0, function() {
            $('#circle').circleProgress({
              value: 1.0,
              fill: {
                color: "#ffffff"
              },
              animation: false
            });
            main.oldCircles[0] = 1.0;
            main.oldCircles[1] = 'rotate(0deg)';
            $('#circle').fadeTo(300, 1.0);
          });
        }, 300);
        break;
      case 4:
        $('#circle').circleProgress({
          value: main.oldCircles[0],
          fill: {
            color: "#FBC132"
          },
          animation: false
        });
        $('#circle > canvas').css('transform', main.oldCircles[1]);
        setTimeout(function() {
          $('#header').fadeTo(250, 0.0, function() {
            $('#header').text(main.livPrompts.getPrompt('YAWN'));
          });
          $('#header').fadeTo(500, 1.0);
          $('#circle').fadeTo(300, 0.0, function() {
            $('#circle').circleProgress({
              value: 1.0,
              fill: {
                color: "#ffffff"
              },
              animation: false
            });
            main.oldCircles[0] = 1.0;
            main.oldCircles[1] = 'rotate(0deg)';
            $('#circle').fadeTo(300, 1.0);
          });
        }, 300);
        break;
      default:
    }
  }

  //exit the modal post completion of task
// 	this.exitOut = () => {
//     if (!main.hidden){
//     setTimeout(() => {
//       if ($('#voiceItModal').hasClass('visible')){
//           $('#voiceItModal').modal("hide");
//         }
//     }, 3000);
//   }
// }

  $(window).on('beforeunload', function() {
    // main.socket.disconnect(true);
    // main.socket = null;
  });


  function readWASMBinary(url, onload, onerror, onprogress) {
    var xhr = new XMLHttpRequest();
    xhr.open("GET", url, true);
    xhr.responseType = "arraybuffer";
    xhr.onload = function xhr_onload() {
      if (xhr.status === 200 || xhr.status === 0 && xhr.response) {
        onload(xhr.response);
        return;
      }
      onerror()
    };
    xhr.onerror = onerror;
    xhr.onprogress = onprogress;
    xhr.send(null);
  }


  (function() {

    if(_isWebAssemblySupported) {

      readWASMBinary(main.brfv4BaseURL + brfv4SDKName + ".wasm",
        function(r) {

          brfv4WASMBuffer = r; // see function waitForSDK. The ArrayBuffer needs to be added to the module object.

          addBRFScript();

        },
        function (e) { console.error(e); },
        function (p) { }
      );

    } else {

      addBRFScript();
    }

  })();
}
