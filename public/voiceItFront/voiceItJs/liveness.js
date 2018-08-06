function Liveness(){

	this.brfv4Example = { stats: {} };
	this.livPrompts = new prompts();
	this.cancel = false;
	this.animationFrameId = undefined;

	this.brfv4BaseURL = "voiceItFront/voiceItJs/brf-js/libs/brf_wasm/";
	this.support = (typeof WebAssembly === 'object');
	this.oldCircles = [];
	this.socket;
	this.setup = false;

	this.webcam			= document.getElementById("myVideo");		// our this.webcam video
	this.imageData		= document.getElementById("imageData");	// image data for BRFv4
	this.imageDataCtx	= this.imageData.getContext('2d');
	this.brfv4			= null;
	this.brfmanager		= undefined;
	this.resolution		= null;
	this.ua	= navigator.userAgent;
	this.test;
	this.stats;

	var main = this;

	if(main.support) {
		function testSafariWebAssemblyBug() {
		var bin = new Uint8Array([0,97,115,109,1,0,0,0,1,6,1,96,1,127,1,127,3,2,1,0,5,3,1,0,1,7,8,1,4,116,101,115,116,0,0,10,16,1,14,0,32,0,65,1,54,2,0,32,0,40,2,0,11]);
		var mod = new WebAssembly.Module(bin);
		var inst = new WebAssembly.Instance(mod, {});
			return (inst.exports.test(4) !== 0);
		}
			if (!testSafariWebAssemblyBug()) {
				main.support = false;
			}
		}

		if (!main.support) { main.brfv4BaseURL = "voiceItFront/voiceItJs/brf-js/libs/brf_asmjs/"; }

		var script	= document.createElement("script");
		script.setAttribute("type", "text/javascript");
		script.setAttribute("async", true);
		script.setAttribute("src", main.brfv4BaseURL + "BRFv4_JS_TK190218_v4.0.5_trial.js");
		document.getElementsByTagName("head")[0].appendChild(script);

	this.init = function(type) {
		main.cancel = false;
		main.stats	= main.brfv4Example.stats;
		if(main.stats.init) {
			main.stats.init(60);
		}
		main.waitForBRF();
	}

	this.waitForBRF = function() {
			if(main.brfv4 === null) {
				main.brfv4 = {
				 locateFile: function(fileName) {
				 	 return main.brfv4BaseURL+fileName;
				 	}
				 };
				 setTimeout(()=>{
					 if (initializeBRF == undefined){
						 main.waitForBRF();
					 } else {
							initializeBRF(main.brfv4);
					 }
				 },100);
			}
			if(main.brfv4.sdkReady) {
				main.initSDK();
			} else {
				setTimeout(main.waitForBRF, 100);
			}
		}

	this.initSDK = function() {
			main.resolution	= new main.brfv4.Rectangle(0, 0, main.imageData.width, main.imageData.height);
			main.brfmanager	= new main.brfv4.BRFManager();
			main.brfmanager.init(main.resolution, main.resolution, "com.tastenkunst.brfv4.js.examples.minimal.webcam");
			main.brfmanager.setMode('BRFMode.FACE_TRACKING');
			if (main.setup == false){
				main.socket = io.connect('/',{reconnection:true, reconnectionDelay: 1, randomizationFactor: 0, reconnectionDelayMax: 1});
				main.assignSocketEvents();
			}
	}

	this.assignSocketEvents = function() {
		main.socket.emit('initLiveness', 1);
		main.socket.on('initiated', function(s){
			main.test = s;
			main.createLivenessCircle();
			main.trackfaces();
			window.requestAnimationFrame(main.trackfaces);
			main.drawCircle(main.test);
		});
		main.socket.on('test', function(test){
			main.redrawCircle(test);
		});
		main.socket.on('reTest', function(test){
			setTimeout(function(){
			$('#overlay2').fadeTo(300,0.3);
			},300);
			$('#circle').css('display','block');
			main.redrawCircle(test);
		});
		main.socket.on('completeLiveness', function(code){
			switch (code){
				case 7:
					$('#circle').circleProgress({value: main.oldCircles[0], fill: {color: "#FBC132"}, animation: false});
					$('#circle > canvas').css('transform', main.oldCircles[1]);
					break;
				case 6:
					$('#circle').circleProgress({value: main.oldCircles[0], fill: {color: "#FBC132"}, animation: false});
					$('#circle > canvas').css('transform', main.oldCircles[1]);
					setTimeout(function(){
						$('#circle').fadeTo(200,0.0,function(){
							$('#circle').css('display','none');
						});
					},300);
					main.cancel = true;
				break;
				case 4:
					//show waiting for response, passed liveness tests
					$('#circle').circleProgress({value: main.oldCircles[0], fill: {color: "#FBC132"}, animation: false});
					$('#circle > canvas').css('transform', main.oldCircles[1]);
					setTimeout(function(){
						$('#circle').fadeTo(200,0.0,function(){
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
					main.cancel = true;
					break;
					case 3:
					//passed liveness and face identification
							$('#wait').fadeTo(300,0.0,function(){
								$(this).css('display','none');
								$('#header').css('display','inline-block');
								$('#header').fadeTo(300,1.0);
								$('#header').text(main.livPrompts.getPrompt("LIVENESS_SUCCESS"));
							});
					main.cancel = true;
					main.exitOut();
					break;
					case 2:
					//failed face, but passed liveness
					$('#wait').fadeTo(300,0.0,function(){
						$('#wait').css('display','none');
						$('#header').css('display','inline-block');
						$('#header').fadeTo(300,1.0);
						$('#header').text(main.livPrompts.getPrompt("LIVENESS_FAILED"));
					});

					main.cancel = true;
					main.exitOut();
					break;
					case 1:
					//failed, give more tries
					$('#circle').fadeTo(300,0.0,function(){
						$(this).css('display','none');
					});
					$('#overlay2').fadeTo(300,1.0);
					$('#header').fadeTo(300,0,function(){
						$(this).text(main.livPrompts.getPrompt("LIVENESS_TRY_AGAIN"));
						$('#header').fadeTo(300,1.0);
					});
					break;
					case 0:
					//failed liveness
					$('#circle').fadeTo(300,0.0,function(){
						$(this).css('display','none');
					});
					$('#overlay2').fadeTo(300,1.0);
					$('#header').fadeTo(300,0,function(){
						$(this).text(main.livPrompts.getPrompt("LIVENESS_FAILED"));
						$('#header').fadeTo(300,1.0);
					});
					main.cancel = true;
					main.exitOut();
				break;
				default:
			}
		});
	}

	this.trackfaces = function () {
			if (main.stats.start) main.stats.start();
			main.brfmanager.update(main.imageDataCtx.getImageData(0,0, main.resolution.width, main.resolution.height).data);

	 		var faces = main.brfmanager.getFaces();
      var face = faces[0];

			if (face.state === main.brfv4.BRFState.FACE_TRACKING_START ||
			face.state === main.brfv4.BRFState.FACE_TRACKING) {
					main.socket.emit('data', face);
			}
			if (main.stats.end) {
				main.stats.end();
			}
			if(!main.cancel){
				main.animationFrameId = window.requestAnimationFrame(main.trackfaces);
			} else {
			}
		}

	this.stop = () => {
		main.cancel = true;
		setTimeout(() => {
			main.brfv4Example = { stats: {} };
			main.animationFrameId = null;
			main.oldCircles = [];
			main.webcam	= document.getElementById("myVideo");
			main.imageData = document.getElementById("imageData");
			main.imageDataCtx	= main.imageData.getContext('2d');
			main.brfv4 = null;
			main.brfmanager = null;
			main.resolution = null;
			main.ua	= null;
			main.test = null;
			main.stats = null;
		},200);
	}

	this.resume = function (){
		main.setup = true;
		main.cancel = false;
		main.init();
	}

	this.createLivenessCircle = function() {
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

	this.drawCircle = function(int){
	switch (int) {
		case 0:
		$('#header').css('opacity','0.0');
		$('#header').text(main.livPrompts.getPrompt('FACE_DOWN'));
		$('#header').fadeTo(500,1.0);
		$('#circle').css('opacity','0.0');
		$('#circle').circleProgress({value: 0.25, fill: {color: "#ffffff"}, animation: false});
		$('#circle > canvas').css('transform', 'rotate(0deg)');
		main.oldCircles[0] = 0.25;
		main.oldCircles[1] = 'rotate(0deg)';
		break;
		case 1:
		$('#header').css('opacity','0.0');
		$('#header').text(main.livPrompts.getPrompt('FACE_RIGHT'));
		$('#header').fadeTo(500,1.0);
		$('#circle').css('opacity','0.0');
		$('#circle').circleProgress({value: 0.25, fill: {color: "#ffffff"}, animation: false});
		$('#circle > canvas').css('transform', 'rotate(-90deg)');
		main.oldCircles[0] = 0.25;
		main.oldCircles[1] = 'rotate(-90deg)';
		break;
		case 2:
		$('#header').css('opacity','0.0');
		$('#header').text(main.livPrompts.getPrompt('FACE_LEFT'));
		$('#header').fadeTo(500,1.0);
		$('#circle').css('opacity','0.0');
		$('#circle').circleProgress({value: 0.25, fill: {color: "#ffffff"}, animation: false});
		$('#circle > canvas').css('transform', 'rotate(90deg)');
		main.oldCircles[0] = 0.25;
		main.oldCircles[1] = 'rotate(90deg)';
		break;
		case 3:
		$('#header').css('opacity','0.0');
		$('#header').text(main.livPrompts.getPrompt('SMILE'));
		$('#header').fadeTo(500,1.0);
		$('#circle').css('opacity','0.0');
		$('#circle').circleProgress({value: 1.0, fill: {color: "#ffffff"}, animation: false});
		$('#circle > canvas').css('transform', 'rotate(0deg)');
		main.oldCircles[0] = 1.0;
		main.oldCircles[1] = 'rotate(0deg)';
		break;
		case 4:
		$('#header').css('opacity','0.0');
		$('#header').text(main.livPrompts.getPrompt('YAWN'));
		$('#header').fadeTo(500,1.0);
		$('#circle').css('opacity','0.0');
		$('#circle').circleProgress({value: 1.0, fill: {color: "#ffffff"}, animation: false});
		$('#circle > canvas').css('transform', 'rotate(0deg)');
		main.oldCircles[0] = 1.0;
		main.oldCircles[1] = 'rotate(0deg)';
		break;
		default:
		}
	}

	this.redrawCircle = function(int){
		switch (int) {
			case 0:
			$('#circle').circleProgress({value: main.oldCircles[0], fill: {color: "#FBC132"}, animation: false});
			$('#circle > canvas').css('transform', main.oldCircles[1]);
			setTimeout(function(){
				$('#header').fadeTo(250,0.0,function(){
				$('#header').text(main.livPrompts.getPrompt('FACE_DOWN'));
				});
				$('#header').fadeTo(500,1.0);
				$('#circle').fadeTo(200,0.0,function(){
				$('#circle').circleProgress({value: 0.25, fill: {color: "#ffffff"}, animation: false});
				$('#circle > canvas').css('transform', 'rotate(0deg)');
				$('#circle').css('opacity',1.0);
				main.oldCircles[0] = 0.25;
				main.oldCircles[1] = 'rotate(0deg)';
				$('#circle').fadeTo(200,1.0);
				});
			},300);
			break;
			case 1:
			$('#circle').circleProgress({value: main.oldCircles[0], fill: {color: "#FBC132"}, animation: false});
			$('#circle > canvas').css('transform', main.oldCircles[1]);
			setTimeout(function(){
				$('#header').fadeTo(250,0.0,function(){
					$('#header').text(main.livPrompts.getPrompt('FACE_RIGHT'));
				});
				$('#header').fadeTo(500,1.0);
				$('#circle').fadeTo(200,0.0, function(){
				$('#circle').circleProgress({value: 0.25, fill: {color: "#ffffff"}, animation: false});
				$('#circle > canvas').css('transform', 'rotate(-90deg)');
				main.oldCircles[0] = 0.25;
				main.oldCircles[1] = 'rotate(-90deg)';
				$('#circle').fadeTo(200,1.0);
				});
			},300);
			break;
			case 2:
			$('#circle').circleProgress({value: main.oldCircles[0], fill: {color: "#FBC132"}, animation: false});
			$('#circle > canvas').css('transform', main.oldCircles[1]);
			setTimeout(function(){
				$('#header').fadeTo(250,0.0,function(){
					$('#header').text(main.livPrompts.getPrompt('FACE_LEFT'));
				});
				$('#header').fadeTo(500,1.0);
			$('#circle').fadeTo(200,0.0, function(){
				$('#circle').circleProgress({value: 0.25, fill: {color: "#ffffff"}, animation: false});
				$('#circle > canvas').css('transform', 'rotate(90deg)');
				main.oldCircles[0] = 0.25;
				main.oldCircles[1] = 'rotate(90deg)';
				$('#circle').fadeTo(200,1.0);
			});
			},300);
			break;
			case 3:
			$('#circle').circleProgress({value: main.oldCircles[0], fill: {color: "#FBC132"}, animation: false});
			$('#circle > canvas').css('transform', main.oldCircles[1]);
			setTimeout(function(){
				$('#header').fadeTo(250,0.0,function(){
						$('#header').text(main.livPrompts.getPrompt('SMILE'));
				});
				$('#header').fadeTo(500,1.0);
			$('#circle').fadeTo(200,0.0, function(){
				$('#circle').circleProgress({value: 1.0, fill: {color: "#ffffff"}, animation: false});
				main.oldCircles[0] = 1.0;
				main.oldCircles[1] = 'rotate(0deg)';
				$('#circle').fadeTo(200,1.0);
			});
			},300);
			break;
			case 4:
			$('#circle').circleProgress({value: main.oldCircles[0], fill: {color: "#FBC132"}, animation: false});
			$('#circle > canvas').css('transform', main.oldCircles[1]);
			setTimeout(function(){
				$('#header').fadeTo(250,0.0,function(){
				$('#header').text(main.livPrompts.getPrompt('YAWN'));
				});
				$('#header').fadeTo(500,1.0);
			$('#circle').fadeTo(200,0.0, function(){
				$('#circle').circleProgress({value: 1.0, fill: {color: "#ffffff"}, animation: false});
				main.oldCircles[0] = 1.0;
				main.oldCircles[1] = 'rotate(0deg)';
				$('#circle').fadeTo(200,1.0);
			});
			},300);
			break;
			default:
		}
	  }

		//exit the modal post completion of task
		this.exitOut = () => {
			setTimeout(() => {
				$('#voiceItModal').modal("hide");
			},3000);
		}
	}
