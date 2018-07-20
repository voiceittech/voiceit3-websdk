var brfv4Example = { stats: {} };
var data;
var testing = 0;
var livPrompts = new prompts();
var animationID;
var Data = [];

var brfv4BaseURL = "js/brf-js/libs/brf_wasm/";
var support	= (typeof WebAssembly === 'object');
var oldCircles = [];

	if(support) {
		function testSafariWebAssemblyBug() {
		var bin = new Uint8Array([0,97,115,109,1,0,0,0,1,6,1,96,1,127,1,127,3,2,1,0,5,3,1,0,1,7,8,1,4,116,101,115,116,0,0,10,16,1,14,0,32,0,65,1,54,2,0,32,0,40,2,0,11]);
		var mod = new WebAssembly.Module(bin);
		var inst = new WebAssembly.Instance(mod, {});
			return (inst.exports.test(4) !== 0);
		}
			if (!testSafariWebAssemblyBug()) {
				support = false;
			}
		}

		if (!support) { brfv4BaseURL = "js/brf-js/libs/brf_asmjs/"; }

var script	= document.createElement("script");
		script.setAttribute("type", "text/javascript");
		script.setAttribute("async", true);
		script.setAttribute("src", brfv4BaseURL + "BRFv4_JS_TK190218_v4.0.5_trial.js");
		document.getElementsByTagName("head")[0].appendChild(script);

	function liveness(type) {
		var socket = io.connect('http://localhost:8000',{reconnection:true, reconnectionDelay: 1, randomizationFactor: 0, reconnectionDelayMax: 1});

		var webcam			= document.getElementById("myVideo");		// our webcam video
		var imageData		= document.getElementById("imageData");	// image data for BRFv4
		var imageDataCtx	= null;
		var brfv4			= null;
		var brfManager		= null;
		var resolution		= null;
		var ua				= navigator.userAgent;
		var isIOS11			= (ua.indexOf("iPad") > 0 || ua.indexOf("iPhone") > 0) && ua.indexOf("OS 11_") > 0;
		var test;

		var stats			= brfv4Example.stats;
		if(stats.init) { stats.init(60); }

		startCamera();

		function startCamera() {

			console.log("startCamera");

      navigator.mediaDevices.getUserMedia({ audio: false, video: {
				width: { min: 640, ideal: 640, max: 640 },
				height: { min: 480, ideal: 480, max: 480 }
			}})
      .then(onStreamFetched).catch(function (err) { console.log("No camera available: " + err); });

			function onStreamFetched (mediaStream) {
				console.log(" liveness initiated");

				webcam.srcObject = mediaStream;
				webcam.play();

				function onStreamDimensionsAvailable () {

					console.log("onStreamDimensionsAvailable");

					if (webcam.videoWidth === 0) {
						setTimeout(onStreamDimensionsAvailable, 100);
					} else {

						imageData.width		= webcam.videoWidth;
						imageData.height	= webcam.videoHeight;
						imageDataCtx		= imageData.getContext("2d");

						if(isIOS11) {
							webcam.pause();
							webcam.srcObject.getTracks().forEach(function(track) {
								track.stop();
							});
						}
						waitForSDK();
					}
				}

				if(imageDataCtx === null) {
					onStreamDimensionsAvailable();
				} else {
				//	trackFaces();
				}
			}
		}

	function waitForSDK() {
      console.log("waiting for sdk");
			if(brfv4 === null) {
				brfv4 = { locateFile: function(fileName) { return brfv4BaseURL+fileName; } };
				initializeBRF(brfv4);
			}

			if(brfv4.sdkReady) {
          	console.log("sdk is ready");
				initSDK();
			} else {
				setTimeout(waitForSDK, 100);
			}
		}

	function initSDK() {
			resolution	= new brfv4.Rectangle(0, 0, imageData.width, imageData.height);
			brfManager	= new brfv4.BRFManager();
			brfManager.init(resolution, resolution, "com.tastenkunst.brfv4.js.examples.minimal.webcam");

			//Give option to select number of liveness tests?
			var numOfTests = 5;

				socket.on('initiated', function(s){
					test = s;
					createLivenessCircle();
					trackFaces();
					drawCircle(test);
				});
				socket.on('test', function(test){
					redrawCircle(test);
				});
				socket.on('test2', function(test){
					setTimeout(function(){
					$('#overlay2').fadeTo(300,0.3);	
					},300); 
					$('#circle').css('display','block');
					redrawCircle(test);
				});
				socket.on('completeLiveness', function(s){
					if (s == 5){
						window.cancelAnimationFrame(animationID);
					}
					else if (s == 4){
						//show waiting for response, passed liveness tests
						$('#circle').circleProgress({value: oldCircles[0], fill: {color: "#FBC132"}, animation: false});
						$('#circle > canvas').css('transform', oldCircles[1]);
						setTimeout(function(){
							$('#circle').fadeTo(200,0.0,function(){
								console.log('fading circleee');
								$('#circle').css('display','none');
							});
						},300);
						$('#overlay2').fadeTo(300,1.0);
						$('#header').fadeTo(300,0,function(){
							$('#header').css('display','none');
							$('#wait').css('display','inline-block');
							$('#wait').css('opacity','0');
							$('#wait').fadeTo(300,1.0);
						});
						window.cancelAnimationFrame(animationID);
					} else if (s == 3){
						//passed liveness and face identification
								$('#wait').fadeTo(300,0.0,function(){
									$(this).css('display','none');
									$('#header').css('display','inline-block');
									$('#header').fadeTo(300,1.0);
									$('#header').text(livPrompts.getPrompt("LIVENESS_SUCCESS"));
								});
						window.cancelAnimationFrame(animationID);
					} else if (s == 2){
						//failed face, but passed liveness
						$('#wait').fadeTo(300,0.0,function(){
							$(this).css('display','none');
							$('#header').css('display','inline-block');
							$('#header').fadeTo(300,1.0);
							$('#header').text(livPrompts.getPrompt("LIVENESS_FAILED"));
						});
						window.cancelAnimationFrame(animationID);
					}  else if (s == 1) {
						//failed, give more tries
						$('#circle').fadeTo(300,0.0,function(){
							$(this).css('display','none');
						});
						$('#overlay2').fadeTo(300,1.0);
						$('#header').fadeTo(300,0,function(){
							$(this).text(livPrompts.getPrompt("LIVENESS_TRY_AGAIN"));
							$('#header').fadeTo(300,1.0);
						});
					} 
					else if (s == 0){
						//failed liveness
						$('#circle').fadeTo(300,0.0,function(){
							$(this).css('display','none');
						});
						$('#overlay2').fadeTo(300,1.0);
						$('#header').fadeTo(300,0,function(){
							$(this).text(livPrompts.getPrompt("LIVENESS_FAILED"));
							$('#header').fadeTo(300,1.0);
						});
						window.cancelAnimationFrame(animationID);
					}
	      });
		}

	function trackFaces() {

			if (stats.start) stats.start();

			imageDataCtx.setTransform(-1.0, 0, 0, 1, resolution.width, 0); // mirrored for draw of video
			imageDataCtx.drawImage(webcam, 0, 0, resolution.width, resolution.height);
			imageDataCtx.setTransform( 1.0, 0, 0, 1, 0, 0); // unmirrored for draw of results
			data = imageDataCtx.getImageData(0,0, resolution.width, resolution.height).data;
			brfManager.update(data);
			// Data.push(data);

	 var faces = brfManager.getFaces();
      var face = faces[0];

			if (face.state === brfv4.BRFState.FACE_TRACKING_START ||
			face.state === brfv4.BRFState.FACE_TRACKING) {
					socket.emit('data', face);
			}
			if (stats.end) stats.end();
			animationID = requestAnimationFrame(trackFaces);
		}

	function createLivenessCircle() {
		$('#circle').circleProgress({
	 value: 0.25,
	 size: 268,
	 fill: {
	   color: "#ffb602"
	 },
	 startAngle : Math.PI/4,
	 thickness: 5,
	 lineCap: "round",
	 emptyFill: 'rgba(0,0,0,0)',
	 animation: false
	});
}


	function drawCircle(int){
	switch (int) {
		case 0:
		$('#header').css('opacity','0.0');
		$('#header').text(livPrompts.getPrompt('FACE_DOWN'));
		$('#header').fadeTo(500,1.0);
		$('#circle').css('opacity','0.0');
		$('#circle').circleProgress({value: 0.25, fill: {color: "#ffffff"}, animation: false});
		$('#circle > canvas').css('transform', 'rotate(0deg)');
		oldCircles[0] = 0.25;
		oldCircles[1] = 'rotate(0deg)';
		break;
		case 1:
		$('#header').css('opacity','0.0');
		$('#header').text(livPrompts.getPrompt('FACE_RIGHT'));
		$('#header').fadeTo(500,1.0);
		$('#circle').css('opacity','0.0');
		$('#circle').circleProgress({value: 0.25, fill: {color: "#ffffff"}, animation: false});
		$('#circle > canvas').css('transform', 'rotate(-90deg)');
		oldCircles[0] = 0.25;
		oldCircles[1] = 'rotate(-90deg)';
		break;
		case 2:
		$('#header').css('opacity','0.0');
		$('#header').text(livPrompts.getPrompt('FACE_LEFT'));
		$('#header').fadeTo(500,1.0);
		$('#circle').css('opacity','0.0');
		$('#circle').circleProgress({value: 0.25, fill: {color: "#ffffff"}, animation: false});
		$('#circle > canvas').css('transform', 'rotate(90deg)');
		oldCircles[0] = 0.25;
		oldCircles[1] = 'rotate(90deg)';
		break;
		case 3:
		$('#header').css('opacity','0.0');
		$('#header').text(livPrompts.getPrompt('SMILE'));
		$('#header').fadeTo(500,1.0);
		$('#circle').css('opacity','0.0');
		$('#circle').circleProgress({value: 1.0, fill: {color: "#ffffff"}, animation: false});
		$('#circle > canvas').css('transform', 'rotate(0deg)');
		oldCircles[0] = 1.0;
		oldCircles[1] = 'rotate(0deg)';
		break;
		case 4:
		$('#header').css('opacity','0.0');
		$('#header').text(livPrompts.getPrompt('YAWN'));
		$('#header').fadeTo(500,1.0);
		$('#circle').css('opacity','0.0');
		$('#circle').circleProgress({value: 1.0, fill: {color: "#ffffff"}, animation: false});
		$('#circle > canvas').css('transform', 'rotate(0deg)');
		oldCircles[0] = 1.0;
		oldCircles[1] = 'rotate(0deg)';
		break;
		default:
	}
}

	function redrawCircle(int){
		switch (int) {
			case 0:
			$('#circle').circleProgress({value: oldCircles[0], fill: {color: "#FBC132"}, animation: false});
			$('#circle > canvas').css('transform', oldCircles[1]);
			setTimeout(function(){
				$('#header').fadeTo(250,0.0,function(){
				$('#header').text(livPrompts.getPrompt('FACE_DOWN'));
				});
				$('#header').fadeTo(500,1.0);
				$('#circle').fadeTo(200,0.0,function(){
				$('#circle').circleProgress({value: 0.25, fill: {color: "#ffffff"}, animation: false});
				$('#circle > canvas').css('transform', 'rotate(0deg)');
				$('#circle').css('opacity',1.0);
				oldCircles[0] = 0.25;
				oldCircles[1] = 'rotate(0deg)';
				$('#circle').fadeTo(200,1.0);
				});
			},300);
			break;
			case 1:
			$('#circle').circleProgress({value: oldCircles[0], fill: {color: "#FBC132"}, animation: false});
			$('#circle > canvas').css('transform', oldCircles[1]);
			setTimeout(function(){
				$('#header').fadeTo(250,0.0,function(){
					$('#header').text(livPrompts.getPrompt('FACE_RIGHT'));
				});
				$('#header').fadeTo(500,1.0);
				$('#circle').fadeTo(200,0.0, function(){
				$('#circle').circleProgress({value: 0.25, fill: {color: "#ffffff"}, animation: false});
				$('#circle > canvas').css('transform', 'rotate(-90deg)');
				oldCircles[0] = 0.25;
				oldCircles[1] = 'rotate(-90deg)';
				$('#circle').fadeTo(200,1.0);
				});
			},300);
			break;
			case 2:
			$('#circle').circleProgress({value: oldCircles[0], fill: {color: "#FBC132"}, animation: false});
			$('#circle > canvas').css('transform', oldCircles[1]);
			setTimeout(function(){
				$('#header').fadeTo(250,0.0,function(){
					$('#header').text(livPrompts.getPrompt('FACE_LEFT'));
				});
				$('#header').fadeTo(500,1.0);
			$('#circle').fadeTo(200,0.0, function(){
				$('#circle').circleProgress({value: 0.25, fill: {color: "#ffffff"}, animation: false});
				$('#circle > canvas').css('transform', 'rotate(90deg)');
				oldCircles[0] = 0.25;
				oldCircles[1] = 'rotate(90deg)';
				$('#circle').fadeTo(200,1.0);
			});
			},300);
			break;
			case 3:
			$('#circle').circleProgress({value: oldCircles[0], fill: {color: "#FBC132"}, animation: false});
			$('#circle > canvas').css('transform', oldCircles[1]);
			setTimeout(function(){
				$('#header').fadeTo(250,0.0,function(){
						$('#header').text(livPrompts.getPrompt('SMILE'));
				});
				$('#header').fadeTo(500,1.0);
			$('#circle').fadeTo(200,0.0, function(){
				$('#circle').circleProgress({value: 1.0, fill: {color: "#ffffff"}, animation: false});
				oldCircles[0] = 1.0;
				oldCircles[1] = 'rotate(0deg)';
				$('#circle').fadeTo(200,1.0);
			});
			},300);
			break;
			case 4:
			$('#circle').circleProgress({value: oldCircles[0], fill: {color: "#FBC132"}, animation: false});
			$('#circle > canvas').css('transform', oldCircles[1]);
			setTimeout(function(){
				$('#header').fadeTo(250,0.0,function(){
				$('#header').text(livPrompts.getPrompt('YAWN'));
				});
				$('#header').fadeTo(500,1.0);
			$('#circle').fadeTo(200,0.0, function(){
				$('#circle').circleProgress({value: 1.0, fill: {color: "#ffffff"}, animation: false});
				oldCircles[0] = 1.0;
				oldCircles[1] = 'rotate(0deg)';
				$('#circle').fadeTo(200,1.0);
			});
			},300);
			break;
			default:
		}
	}
}
