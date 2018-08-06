function voiceIt2Obj() {
  var main = this;
  this.video;
  this.player;
  this.enrollCounter = 0;
  this.prompt = new prompts();
  this.type = {
    biometricType: "",
    action: ""
  };
  this.setupVJS = false;
  this.MAX_ATTEMPTS = 3;
  this.liveness = false;
  this.timeStampId;

  //display/control objects such as overlays, waveforms, etc
  this.wavej;
  this.circlej;
  this.vidCirclej;
  this.headerj;
  this.vidFramej;
  this.warningOverlayj;
  this.waitj;
  this.wait2j;
  this.readyButtonj;
  this.overlayj;
  this.audioVisualizer;
  this.livenessType = "face";

  //needed for the audio/video streams, and for destroying instances
  this.videoCircleStream;
  this.imageDataCtx;
  this.videoStream;
  this.attempts = 0;
  this.setupWaveForm = false;
  this.destroyed = false;
  this.errorCodes = ["TVER", "PNTE", "NFEF", "UNAC"];

  this.livenessObj;
  this.assignedLivEvents = false;
  this.enrollmentNeededFace = false;
  this.enrollmentNeededVoice = false;

  this.encapsulatedVoiceEnrollment = function() {
    main.type.biometricType = 'voice';
    main.type.action = 'Enrollment';
    main.initiate();
  }

  this.encapsulatedVoiceVerification = function() {
    main.type.biometricType = 'voice';
    main.type.action = 'Verification';
    if (!main.enrollmentNeededVoice) {
      main.initiate();
    } else {
      $('#enrollVoice').fadeTo(300, 1.0);
      setTimeout(function() {
        $('#enrollVoice').fadeTo(100, 0.0);
      }, 2000);
    }
  }

  this.encapsulatedFaceVerification = function(liveness) {
    main.liveness = liveness;
    main.type.biometricType = 'face';
    main.type.action = 'Verification';
    if (!main.enrollmentNeededFace) {
      main.initiate();
    } else {
      $('#enrollFace').fadeTo(300, 1.0);
      setTimeout(function() {
        $('#enrollFace').fadeTo(100, 0.0);
      }, 2000);
    }
  }

  this.encapsulatedFaceEnrollment = function() {
    main.type.biometricType = 'face';
    main.type.action = 'Enrollment';
    main.initiate();
  }

  this.encapsulatedVideoVerification = function(liveness) {
    main.liveness = liveness;
    main.type.biometricType = 'video';
    main.type.action = 'Verification';
    if (!main.enrollmentNeededVoice) {
      main.initiate();
    } else {
      $('#enrollVideo').fadeTo(300, 1.0);
      setTimeout(function() {
        $('#enrollVideo').fadeTo(100, 0.0);
      }, 2000);
    }
  }

  this.encapsulatedVideoEnrollment = function() {
    main.type.biometricType = 'video';
    main.type.action = 'Enrollment';
    main.initiate();
  }

  //initiate the module
  this.init = function() {
    var init = false;
    main.socket2 = io.connect('/', {
      reconnection: true,
      reconnectionDelay: 1,
      randomizationFactor: 0,
      reconnectionDelayMax: 1,
    });
    main.socket2.emit('requestEnrollmentDetails', 1);
    main.assignClicks();
  }

  this.assignClicks = function() {
    main.socket2.on("enrollmentNeeded", function(response) {
      if (response.type == "face" && response.code == 1) {
        main.enrollmentNeededFace = true;
      } else if (response.type == "voice" && response.code == 1) {
        main.enrollmentNeededVoice = true;
      }
    });
    main.socket2.on('stopRecording', function(response) {
      if (main.player !== undefined){
            main.player.record().stop();
      }
    });
    main.socket2.on('completeLiveness', function(response) {
      if (response == 5) {
        main.livenessType = "voice";
        setTimeout(function() {
          $('#circle').fadeTo(200, 0.0, function() {});
        }, 300);
        main.overlayj.fadeTo(300, 1.0);
        $('#header').fadeTo(300, 0, function() {
          $('#header').css('display', 'none');
          $('#wait').css('display', 'inline-block');
          $('#wait').css('opacity', '0');
          $('#wait').fadeTo(300, 1.0, function() {
            setTimeout(function() {
              main.overlayj.fadeTo(300, 0.3);
              $('#wait').fadeTo(300, 0.0, function() {
                $(this).css('display', 'none');
                $('#header').css('display', 'inline-block');
                $('#header').fadeTo(300, 1.0);
                $('#header').text(main.prompt.getPrompt("VERIFY"));
                main.player.record().start();
                setTimeout(function() {
                  if (main.player !== undefined) {
                    main.player.record().stop();
                  }
                }, 5000);
                main.createVideoCircle();
                main.vidCirclej.css('display', 'block');
                main.vidCirclej.fadeTo(500, 0.5);
                setTimeout(function() {
                  main.createCircle();
                  main.circlej.fadeTo(300, 1.0);
                }, 200);
              });
            }, 500);
          });
        });
      }
    });

    main.socket2.on('requestResponse', function(response) {
      //check if it was deletion
      if (response.type == "deleteEnrollments") {
        main.handleDeletion(response);
      }
      //All other API call such as verifications, enrollments, etc.
      else {
        if (!main.destroyed) {
          response = response.response;
          if (main.type.action == "Enrollment") {
            if (response.responseCode == "SUCC") {
              if (main.enrollCounter < 3) {
                main.enrollCounter = main.enrollCounter + 1;
                main.continueEnrollment(response);
              }
            } else {
              main.attempts++;
              if (main.attempts > main.MAX_ATTEMPTS) {
                main.waitj.fadeTo(500, 0.0, function() {
                  $(this).css('display', 'none');
                  main.headerj.css('dislay', 'inline-block');
                  main.headerj.fadeTo(500, 1.0);
                });
                main.headerj.text(main.prompt.getPrompt("MAX_ATTEMPTS"));
                main.exitOut();
              } else {
                main.continueEnrollment(response);
              }
            }
          } else if (main.type.action == "Verification") {
            if (response.responseCode == "SUCC") {
              main.exitOut();
              main.handleResponse(response);
              //do something after successful. Right now it just stays there
            } else {
              main.attempts++;
              //continue to verify
              if (main.attempts > main.MAX_ATTEMPTS) {
                //save the max attempts in the user session?
                main.waitj.fadeTo(500, 0.0, function() {
                  $(this).css('display', 'none');
                  main.headerj.css('dislay', 'inline-block');
                  main.headerj.fadeTo(500, 1.0);
                });
                main.headerj.text(main.prompt.getPrompt("MAX_ATTEMPTS"));
                main.exitOut();
              } else {
                main.handleResponse(response);
                if (!main.errorCodes.includes(response.responseCode)) {
                  setTimeout(function() {
                    main.continueVerification(response);
                  }, 100);
                }
              }
            }
          }
        }
      }
    });

    $('#skipButton').click(function() {
      $('#warningOverlay').fadeTo(400, 0.0, function() {
        $('#skipButton').css('display', 'none');
        $('#warningOverlay').css('display', 'none');
      })
    });

    //Assigning the start() function to the read button
    $('#readyButton').click(
      function() {
        main.start();
        if (main.type.biometricType !== "voice") {
          main.circlej.fadeTo(500, 1.0);
        }
        if (main.liveness && main.type.action !== "Enrollment" && main.type.biometricType !== "voice") {
          var obj = {
            type: main.type.biometricType
          };
          main.livenessType = 'face';
          main.socket2.emit('initiate', obj);
        }
      }
    );

    //warning overlay buttons
    $('.ic').eq(0).click(
      function() {
        $('#closeButton').click();
      }
    );

    //proceede for enrollment
    $('.ic').eq(1).click(
      function() {
        main.destroyed = false;
        var options = {
          biometricType: "delete",
          action: "Enrollments"
        };
        //Request deleteAllEnrollmentsForUser Call
        //Control now transferred to socket.on(..)
        main.socket2.emit('apiRequest', options);
        $('#warningOverlay > span').fadeTo(300, 0.0);
        $('#warningOverlay > div').fadeTo(300, 0.0, function() {
          $('#warningOverlay > span').css('display', 'none');
          $('#warningOverlay > div').css('display', 'none');
          main.wait2j.css('display', 'flex !important');
          main.wait2j.fadeTo(300, 1.0);
        });
      });

    $('#voiceItModal')
      .modal({
        onHide: function() {
          main.destroy();
        }
      });

  }
  //called by the the start up buttons
  this.initiate = function() {
    main.createObjects();
    if (main.type.action == 'Enrollment') {
      main.showWarningOverlay();
    } else {
      main.warningOverlayj.css('display', 'none');
    }
    main.setup();
    //main.convertSVG();
  }

  this.createObjects = function() {
    //create J-Query object; needed to perform JQ specific methods such as fading, and also others such as changin css styles
    main.wavej = $('#waveform').eq(0);
    main.circlej = $('#circle').eq(0);
    main.vidCirclej = $('#videoCircle').eq(0);
    main.headerj = $('#header').eq(0);
    main.vidFramej = $('#imageData').eq(0);
    main.warningOverlayj = $('#warningOverlay').eq(0);
    main.waitj = $('#wait').eq(0);
    main.wait2j = $('#wait2').eq(0);
    main.readyButtonj = $('#readyButton').eq(0);
    main.overlayj = $('#overlay2').eq(0);
  }

  this.showWarningOverlay = function() {
    $('#skipButton').css('display', 'none');
    $("#livenessTutorial").css('display', 'none');
    $("#livenessText").css('display', 'none');
    setTimeout(function() {
      main.wavej.css('opacity', '0.0');
      main.vidFramej.css('opacity', '0.0');
      main.readyButtonj.css('opacity', '0.0');
    }, 200);
    main.wait2j.css('display', 'none');
    setTimeout(function() {
      $('#warningOverlay > div').fadeTo(600, 1.0);
      $('#warningOverlay > span').fadeTo(600, 1.0);
    }, 300);
    main.warningOverlayj.css('display', 'flex');
    main.warningOverlayj.css('opacity', '1.0');
    main.readyButtonj.css('display', 'none');
  }

  this.handleDeletion = function(response) {
    response = response.response;
    if (response.responseCode == "SUCC") {
      main.enrollmentNeededFace = true;
      main.enrollmentNeededVoice = true;
      setTimeout(function() {
        main.warningOverlayj.fadeTo(500, 0.0, function() {
          if (main.type.biometricType == "voice") {
            main.wavej.fadeTo(500, 0.3);
          } else {
            main.vidFramej.fadeTo(500, 1.0);
          }
          main.readyButtonj.fadeTo(500, 1.0);
          main.warningOverlayj.css('display', 'none');
          main.readyButtonj.css('display', 'block');
        });
      }, 1000);
    } else {
      main.headerd
    }
  }

  this.handleResponse = function(response) {
    setTimeout(function() {
      main.waitj.fadeTo(300, 0.0, function() {
        $(this).css('display', 'none');
        main.headerj.css('display', 'inline-block');
        main.headerj.fadeTo(300, 1.0);
      });
      if (response.responseCode == "SUCC") {
        if (main.type.action == "Verification") {
          main.headerj.text(main.prompt.getPrompt("SUCC_VERIFICATION"));
        } else {
          main.headerj.text(main.prompt.getPrompt("SUCC_ENROLLMENT"));
        }
      } else {
        main.headerj.text(main.prompt.getPrompt(response.responseCode));
      }
    }, 500);
  }

  this.continueEnrollment = function(response) {
    //hanlde the response (can use handleresponse() method- will see it later on)
    if (main.type.biometricType !== "face") {
      if (response.responseCode == "SUCC") {
        if (main.enrollCounter == 1) {
          main.headerj.text(main.prompt.getPrompt("SUCC_ENROLLMENT_1"));
        } else if (main.enrollCounter == 2) {
          main.headerj.text(main.prompt.getPrompt("SUCC_ENROLLMENT_2"));
        } else if (main.enrollCounter == 3) {
          if (main.type.biometricType == "voice") {
            $('#enrollVoice').css('opacity', '0.0');
          } else {
            $('#enrollVideo').css('opacity', '0.0');
          }
          main.enrollmentNeededVoice = false;
          main.headerj.text(main.prompt.getPrompt("SUCC_ENROLLMENT_3"));
          main.exitOut();
        }
      } else {
        main.headerj.text(main.prompt.getPrompt(response.responseCode));
      }
      main.waitj.fadeTo(300, 0.0, function() {
        main.waitj.css('display', 'none');
        main.headerj.css('display', 'inline-block');
        main.headerj.fadeTo(300, 1.0);
      });
    } else if (main.type.biometricType == "face") {
      if (response.responseCode == "SUCC") {
        main.enrollmentNeededFace = false;
        $('#enrollFace').css('opacity', '0.0');
        main.headerj.text(main.prompt.getPrompt("SUCC_ENROLLMENT_3"));
      }
      //handle re-recording and animations for face
      else {
        setTimeout(function() {
          $('#circle').fadeTo(350, 0.0);
          main.headerj.fadeTo(500, 0, function() {
            main.headerj.text(main.prompt.getPrompt("LOOK_INTO_CAM"));
            main.headerj.fadeTo(500, 1.0, function() {
              main.createCircle();
              $('#circle').fadeTo(350, 1.0);
            });
          });
          main.overlayj.fadeTo(500, 0.3, function() {
            if (main.player !== undefined) {
              main.player.record().start();
            }
          });
        }, 2000);
        main.headerj.text(main.prompt.getPrompt(response.responseCode));
      }
      main.waitj.fadeTo(300, 0.0, function() {
        main.waitj.css('display', 'none');
        main.headerj.css('display', 'inline-block');
        main.headerj.fadeTo(300, 1.0);
      });
    }

    //handle re-recording and prompts/animations along with it (for voice/video)
    if (main.enrollCounter < 3 && main.type.biometricType !== "face") {
      setTimeout(function() {
        main.circlej.fadeTo(350, 0.0);
        main.headerj.fadeTo(350, 0.0, function() {
          if (main.enrollCounter == 0) {
            main.headerj.text(main.prompt.getPrompt("ENROLL_0"));
          }
          if (main.enrollCounter == 1) {
            main.headerj.text(main.prompt.getPrompt("ENROLL_1"));
          } else if (main.enrollCounter == 2) {
            main.headerj.text(main.prompt.getPrompt("ENROLL_2"));
          }
          main.headerj.fadeTo(350, 1.0, function() {
            if (main.type.biometricType !== "voice") {
              $('#circle').fadeTo(350, 0.0);
              main.createCircle();
              $('#circle').fadeTo(350, 1.0);
            }
          });
        });
        if (main.type.biometricType == "voice") {
          main.circlej.css('opacity', 0.0);
          if (main.player !== undefined) {
            main.player.record().start();
          }
          main.wavej.fadeTo(200, 1.0, function() {});
        } else if (main.type.biometricType == "video") {
          main.overlayj.fadeTo(500, 0.3, function() {
            if (main.player !== undefined) {
              main.player.record().start();
            }
          });
        }
      }, 2000);
    }
  }

  this.setup = function() {
    main.enrollCounter = 0;
    //set all to none to make sure
    main.waitj.css('display', 'none');
    main.circlej.css('display', 'none');
    main.vidCirclej.css('display', 'none');
    main.headerj.text("");
    main.headerj.css('display', 'none');
    main.readyButtonj.css('display', 'inline-block');
    main.overlayj.css('opacity', '0');
    main.showLoadingOverlay();
    if (main.type.biometricType == "voice") {
      main.handleVoiceSetup();
    } else if (main.type.biometricType == "face") {
      main.handleFaceSetup();
    } else {
      main.handleVideoSetup();
    }
  }

  //ready up animations and stuff for voice enroll/verific.
  this.handleVoiceSetup = function() {
    main.headerj.css('opacity', '0.0');
    main.attempts = 0;
    main.vidCirclej.css('display', 'none');
    main.circlej.css('opacity', 'none');
    main.createWaveform();
    main.initVoiceRecord();
    if (!main.setupVJS) {
      main.setupListners();
    }
    main.wavej.css("display", "block");
    main.wavej.fadeTo(800, 0.3);
    window.setTimeout(function() {
      $("button[title='Device']").eq(0).click();
    }, 500);
    main.circlej.css("display", "none");
    main.vidFramej.css('display', 'none');
    //   $("#waveform").fadeTo(2000, 0.6);
    $('#voiceItModal').modal('show');
  }

  //ready up animations and stuff for face enroll/verific.
  this.handleFaceSetup = function() {
    main.attempts = 0;
    main.circlej.css('display', 'block');
    main.circlej.css('opacity', '0.0');
    main.headerj.css('opacity', '0.0');
    $('#imageData').css('display', 'block');
    main.wavej.css('display', 'none');
    window.setTimeout(function() {
      $("button[title='Device']").eq(0).click();
    }, 500);
    main.vidFramej.css('display', 'none');
    main.createVideo();
    main.createOverlay();
    main.vidCirclej.css('display', 'none');
    main.overlayj.css('opacity', '1.0');
    $('#voiceItModal').modal('show');
    main.readyButtonj.css('opacity', 0.0);
    main.readyButtonj.fadeTo(550, 1.0);
    main.vidFramej.css('opacity', '0.0');
    main.vidFramej.fadeTo(550, 1.0);
    if (main.liveness && main.type.action !== "Enrollment") {
      main.initFaceLiv();
      setTimeout(() => {
        if (!main.assignedLivEvents){
        main.livenessObj = new Liveness();
        main.livenessObj.init();
        main.assignedLivEvents = true;
      } else {
        main.livenessObj.resume();
        }
      },150);
    } else {
      main.initFaceRecord();
    }
    if (!main.setupVJS) {
      main.setupListners();
    }
  }

  //ready up animations and stuff for video enroll/verific.
  this.handleVideoSetup = function() {
    main.createOverlay();
    main.attempts = 0;
    main.headerj.css('opacity', '0.0');
    main.circlej.css('opacity', '0.0');
    main.vidFramej.css('display', 'block');
    main.vidFramej.fadeTo(500, 1.0);
    main.wavej.css('display', 'none');
    window.setTimeout(function() {
      $("button[title='Device']").eq(0).click();
    }, 500);
    main.createVideo();
    main.circlej.css('display', 'block');
    main.overlayj.css('opacity', '1.0');
    $('#voiceItModal').modal('show');
    main.wavej.css('display', 'none');
    if (main.liveness && main.type.action !== "Enrollment") {
      main.initFaceLiv();
      setTimeout(() => {
        if (!main.assignedLivEvents){
        main.livenessObj = new Liveness();
        main.livenessObj.init();
        main.assignedLivEvents = true;
      } else {
        main.livenessObj.resume();
        }
      },150);
    } else {
      main.initVideoRecord();
    }
    if (!main.setupVJS) {
      main.setupListners();
    }
  }

  this.initFaceLiv = function() {
    if ($('#videoRecord').length == 0) {
      var video = $('<video />').appendTo('body');
      video.attr('id', 'videoRecord');
      video.attr('class', 'video-js vjs-default-skin');
    }
    main.player = videojs('videoRecord', {
      controls: true,
      width: 640,
      height: 480,
      fluid: false,
      controlBar: {
        fullscreenToggle: false,
        volumePanel: false
      },
      plugins: {
        record: {
          audio: true,
          video: true,
          maxLength: 50,
          debug: true
        }
      }
    }, function() {
      // print version information at startup
      var msg = 'Using video.js ' + videojs.VERSION;
      videojs.log(msg);
    });
  }

  this.createVideo = function() {
    if ($('#myVideo').length == 0) {
      var video = $('<video/>').appendTo('body');
      video.attr('id', 'myVideo');
    }
    var webcam = document.querySelector('#myVideo');
    var imageData = document.getElementById("imageData");
    main.imageDataCtx = imageData.getContext("2d");
    navigator.mediaDevices.getUserMedia({
      audio: false,
      video: {
        height: 480,
        width: 640
      }
    }).then(
      function(stream) {
        webcam.srcObject = stream;
        webcam.onloadedmetadata = function(e) {
          imageData.width = webcam.videoWidth;
          imageData.height = webcam.videoHeight;
          webcam.play();
          main.videoStream = stream;
        }
      }
    ).catch(function(err) {
      console.log(err);
    });

    function drawFrames() {
      //mirror the video by drawing it onto the canvas
      main.imageDataCtx.clearRect( 0, 0, webcam.videoWidth, webcam.videoHeight);
      main.imageDataCtx.setTransform(-1.0, 0, 0, 1, webcam.videoWidth, 0);
      main.imageDataCtx.drawImage(webcam, 0, 0, webcam.videoWidth, webcam.videoHeight);
      window.requestAnimationFrame(drawFrames);
    }
    drawFrames();
  }

  //set up video JS for vocie
  this.initVoiceRecord = function() {
    if ($('#myAudio').length == 0) {
      var audio = $('<audio />').appendTo('body');
      audio.attr('id', 'myAudio');
      audio.attr('class', 'video-js vjs-default-skin');
    }
    main.player = videojs('myAudio', {
      controls: true,
      width: 200,
      height: 200,
      fluid: false,
      controlBar: {
        fullscreenToggle: false,
        volumePanel: false
      },
      plugins: {
        wavesurfer: {
          src: "live",
          waveColor: "#36393b",
          progressColor: "black",
          debug: true,
          cursorWidth: 1,
          msDisplayMax: 20,
          hideScrollbar: true
        },
        record: {
          audio: true,
          video: false,
          maxLength: 5,
          debug: true
        }
      }
    }, function() {
      // print version information at startup
      var msg = 'Using video.js ' + videojs.VERSION;
      videojs.log(msg);
    });
  }

  //set up video JS for viideo
  this.initVideoRecord = function() {
    if ($('#videoRecord').length == 0) {
      var video = $('<video />').appendTo('body');
      video.attr('id', 'videoRecord');
      video.attr('class', 'video-js vjs-default-skin');
    }
    main.player = videojs('videoRecord', {
      controls: true,
      width: 640,
      height: 480,
      fluid: false,
      controlBar: {
        fullscreenToggle: false,
        volumePanel: false
      },
      plugins: {
        record: {
          audio: true,
          video: true,
          maxLength: 5,
          debug: true
        }
      }
    }, function() {
      //print version information at startup
      var msg = 'Using video.js ' + videojs.VERSION;
      videojs.log(msg);
    });
  }

  //set up video JS for face
  this.initFaceRecord = function() {
    if ($('#videoRecord').length == 0) {
      var video = $('<video/>').appendTo('body');
      video.attr('id', 'videoRecord');
      video.attr('class', 'video-js vjs-default-skin');
    }
    main.player = videojs('videoRecord', {
      controls: true,
      width: 640,
      height: 480,
      fluid: false,
      controlBar: {
        fullscreenToggle: false,
        volumePanel: false
      },
      plugins: {
        record: {
          audio: false,
          video: true,
          maxLength: 5,
          debug: true
        }
      }
    }, function() {
      // print version information at startup
      var msg = 'Using video.js ' + videojs.VERSION;
      videojs.log(msg);
    });
  }

  //one-time setup for the listners to prevent duplicate api calls/records
  this.setupListners = function() {
    main.player.on('deviceError', function() {
      console.log('device error:', main.player.deviceErrorCode);
    });
    main.player.on('error', function(error) {
      console.log('error:', error);
    });
    // user this.type the record button and started recording
    main.player.on('startRecord', function() {

    });
    main.player.on('finishRecord', function() {
      if (main.liveness && main.type.action !== "Enrollment" && main.type.biometricType !== "voice") {
        var obj;
        if (main.livenessType == "voice") {
          main.headerj.fadeTo(300, 0.0, function() {
            $(this).css('display', 'none');
            main.waitj.css('display', 'inline-block');
            main.waitj.fadeTo(300, 1.0);
          });
          obj = {
            recording: main.player.recordedData,
            kind: "voice"
          };
          main.vidCirclej.fadeTo(300, 0.3);
          main.overlayj.fadeTo(300, 1.0);
        } else {
            console.log(main.player.recordedData);
          obj = {
            recording: main.player.recordedData,
            kind: "face"
          };
        }
        main.socket2.emit('recording', obj);
      } else {
        if (main.type.biometricType == "voice") {
          main.wavej.fadeTo(300, 0.3);
        } else if (main.type.biometricType == "video") {
          main.vidCirclej.fadeTo(300, 0.3);
          main.overlayj.fadeTo(300, 1.0);
        } else {
          main.overlayj.fadeTo(300, 1.0);
        }
        var options = {
          biometricType: main.type.biometricType,
          action: main.type.action,
          recording: main.player.recordedData
        };
        main.socket2.emit('apiRequest', options);
        main.headerj.fadeTo(300, 0.0, function() {
          $(this).css('display', 'none');
          main.waitj.css('display', 'inline-block');
          main.waitj.fadeTo(300, 1.0);
        });
      }
      //to ensure one-time assignment to the listeners
      main.setupVJS = true;
    });
  }

  $('#closeButton').click(function() {
    main.destroy();
  });


  this.start = function() {
    main.headerj.css('display', 'inline-block');
    if (main.type.action == "Verification" && main.type.biometricType == "voice") {
      main.headerj.css('display', 'inline-block !important');
      main.headerj.css('opacity', '1.0');
      main.headerj.fadeTo(300, 1.0);
      main.headerj.text(main.prompt.getPrompt("VERIFY"));
      main.circlej.css("display", "none");
      main.wavej.fadeTo(500, 1.0);
    }
    if (!main.liveness || main.type.action == 'Enrollment') {
      main.headerj.css('display', 'inline-block !important');
      main.headerj.css('opacity', '1.0');
      main.headerj.fadeTo(300, 1.0);
      if (main.type.biometricType !== "face") {
        main.headerj.text(main.prompt.getPrompt("VERIFY"));
      } else {
        main.headerj.text(this.prompt.getPrompt("LOOK_INTO_CAM"));
      }
      if (main.type.biometricType == "voice") {
        main.circlej.css("display", "none");
        main.wavej.fadeTo(500, 1.0);
      } else if (main.type.biometricType == "face") {
        main.createCircle();
        main.circlej.css("opacity", "1.0");
      } else if (main.type.biometricType == "video") {
        main.createVideoCircle();
        main.vidCirclej.css('display', 'block');
        main.vidCirclej.fadeTo(500, 0.5);
        main.createCircle();
        main.circlej.css("display", "block");
        main.circlej.css("opacity", "1.0");
      }
    }
    main.overlayj.fadeTo(1500, 0.3);
    main.readyButtonj.css('display', 'none');
    if (main.player !== undefined) {
      main.player.record().start();
    }
  }

  //continue verification if errors, response codes, etc
  this.continueVerification = function(response) {
    setTimeout(function() {
      main.circlej.fadeTo(350, 0.0);
      main.headerj.fadeTo(350, 0.0, function() {
        if (main.type.biometricType == "face") {
          main.headerj.text(main.prompt.getPrompt("LOOK_INTO_CAM"));
        } else {
          main.headerj.text(main.prompt.getPrompt("VERIFY"));
        }
        main.headerj.fadeTo(350, 1.0);
      });
      if (main.type.biometricType == "voice") {
        main.circlej.css('opacity', '0.0');
        main.wavej.fadeTo(500, 1.0, function() {
          if (main.player !== undefined) {
            main.player.record().start();
          }
        });
      } else {
        main.circlej.fadeTo(350, 0.0);
        main.overlayj.fadeTo(500, 0.3, function() {
          if (main.player !== undefined) {
            main.player.record().start();
          }
          main.circlej.fadeTo(350, 1.0);
          main.createCircle();
        });
      }
    }, 2000);
  }

  //show this before verification with liveness
  this.showLoadingOverlay = function() {
    var timeOut = 1000;
    if (main.type.action !== "Enrollment") {
      $('#skipButton').css('display', 'none');
      $("#livenessTutorial").css('display', 'none');
      $("#livenessText").css('display', 'none');
      main.vidFramej.css('opacity', '0.0');
      main.wavej.css('opacity', '0.0');
      main.warningOverlayj.css('display', 'flex');
      main.warningOverlayj.css('opacity', '1.0');
      main.wait2j.css('opacity', 0.0);
      main.wait2j.css('display', 'none');
      $('#warningOverlay > div').css('display', 'none');
      $('#warningOverlay > span').css('display', 'none');
      main.wait2j.css('opacity', '0.0');
      main.wait2j.css('display', 'flex');
      main.wait2j.fadeTo(500, 1.0);
      if (!main.liveness || main.type.biometricType == "voice") {
        main.wait2j.css('opacity', '0.0');
        main.wait2j.css('display', 'flex');
        main.wait2j.fadeTo(500, 1.0);
        setTimeout(function() {
          main.warningOverlayj.fadeTo(350, 0.0, function() {
            main.warningOverlayj.css('display', 'none');
            main.destroyed = false;
          });
        }, timeOut);
      } else if (main.liveness) {
        $('#skipButton').css('opacity', '0.0');
        $('#skipButton').css('display', 'initial');
        $('skipButton').css('pointer-events', 'none');
        main.wait2j.css('display', 'none');
        $('#livenessText').css('display', 'flex');
        $("#livenessTutorial").css('display', 'flex');
        timeOut = 8500;
        setTimeout(function() {
          $('skipButton').css('pointer-events', 'auto');
          $('#skipButton').fadeTo(350, 1.0);
        }, 3000);
        setTimeout(function() {
          main.warningOverlayj.fadeTo(550, 0.0, function() {
            main.warningOverlayj.css('display', 'none');
            main.destroyed = false;
          });
        }, timeOut);
      }
    }
  }

  //exit the modal post completion of task
  this.exitOut = () => {
    setTimeout(() => {
      $('#voiceItModal').modal("hide");
    }, 3000);
  }

  //create the surrounding
  this.createCircle = function() {
    var overlayHolder = $('#overlayHolder')[0];
    var imageData = $('#imageData')[0];
    var circle = $('#circle')[0];
    if ((!$('#circle > canvas')[0] == undefined)) {
      var canvas = $('#circle > canvas')[0];
      canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);
      canvas = undefined;
    }
    overlayHolder.removeChild(circle);
    console.log('removing circle');
    $("<div id='circle'></div>").insertBefore(imageData);
    //$('#circle').css('transform','rotate(-90deg)');
    $('#circle').circleProgress({
      value: 1.0,
      size: 268,
      fill: {
        color: "rgb(251,193,50)"
      },
      startAngle: 0,
      thickness: 5,
      lineCap: "round",
      animation: {
        duration: 5100,
        easing: "linear"
      }
    });
  }

  //create the audio waveform
  this.createWaveform = function() {
    if (!main.setupWaveForm) {
      var colors = ['#fb6d6b', '#c10056', ' #a50053', '#51074b'];
      var canvas = document.querySelector('#waveform');
      if (main.audioVisualizer == undefined || main.audioVisualizer == null) {
        main.audioVisualizer = new Vudio(canvas, {
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
      main.setupWaveForm = true;
    }
  }

  //destroy video, canvas, and other objects
  this.destroy = function() {
    if ($('#myVideo').length !== 0) {
      $('#myVideo').remove();
    }

    var imageData = $('#imageData')[0];
    var overlayHolder = $('#overlayHolder')[0];
    $('#skipButton').css('display', 'none');

    if (!($('#circle > canvas')[0] == undefined)) {
      var canvas = $('#circle > canvas')[0];
      var circle = $('#circle')[0];
      canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);
      canvas = undefined;
      circle.remove();
      $("<div id='circle'></div>").insertBefore(imageData);
    }

    if (main.type.biometricType !== "voice") {
      imageData.remove();
      var a = $('#videoCircle')[0];
      $("<canvas id='imageData'></canvas>").insertBefore(a);
    }

    if (main.videoCircleStream !== undefined) {
      main.videoCircleStream.stop();
      main.videoCircleStream = undefined;
    }

    if (main.player !== undefined) {
      main.player.record().destroy();
      main.player = undefined;
      main.setupVJS = false;
    }

    $("#circle").css('display', 'none');
    main.readyButtonj.css('display', 'none');

    if (main.livenessObj !== undefined) {
      main.livenessObj.stop();
      main.socket2.emit('terminate', 1);
    }

    setTimeout(function() {
      if (main.type.biometricType !== "voice") {
        var canvas = $('#imageData')[0];
        var ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        canvas = $('#cv')[0];
        ctx = $('#cv')[0].getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      } else {
        var canvas = $('#waveform')[0];
        var ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        main.audioVisualizer = null;
        //$('#myAudio')[0].remove();
      }
    }, 100);
    main.destroyed = true;
  }

  this.createOverlay = function() {
    var ctx2 = document.getElementById('cv');
    var context2 = ctx2.getContext('2d');
    context2.beginPath();
    context2.arc(230, 148, 131, 0, 2 * Math.PI);
    context2.rect(460, 0, -460, 345);
    context2.fillStyle = "rgba(0,0,0,1.0)";
    context2.fill('evenodd');
  }

  //creates the circular audio waveform around video (verification/enrollment)
  this.createVideoCircle = function() {
    var analyser;
    var amp;
    var vol2;
    var vidCircle = $("#testSound").eq(0);
    navigator.mediaDevices.getUserMedia({
        audio: true,
        video: false
      })
      .then(function(stream) {
        var context = new AudioContext();
        analyser = context.createAnalyser();
        analyser.smoothingTimeConstant = 0.85;
        var microphone = context.createMediaStreamSource(stream);
        microphone.connect(analyser);
        analyser.minDecibels = -95;
        amp = new Uint8Array(analyser.frequencyBinCount);
        main.videoCircleStream = stream;
        window.requestAnimationFrame(draw);
      }).catch(function(err) {
        console.log("error buddy: " + err);
      });
    var draw = function(vol) {
      analyser.getByteFrequencyData(amp);
      var vol = getRMS(amp);
      if (vol > 120) { //max Volume
        vol = 120;
      }
      vol = (vol * 2) / 5;
      vol = (vol + 130); //fit to the overlay
      vidCircle.attr('r', vol);
      window.requestAnimationFrame(draw);
    }

    //helper to get the net audio volume
    function getRMS(spectrum) {
      var rms = 0;
      for (var i = 0; i < spectrum.length; i++) {
        rms += spectrum[i] * spectrum[i];
      }
      rms /= spectrum.length;
      rms = Math.sqrt(rms);
      return rms;
    }
  }
}
