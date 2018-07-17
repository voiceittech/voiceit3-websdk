function voiceIt2(){

    var main = this;
    this.video;
    this.player;
    this.socket2 = io.connect('http://localhost:8000',{reconnection:true, reconnectionDelay: 1, randomizationFactor: 0, reconnectionDelayMax: 1});
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

    //needed for the audio/video streams, and for destroying instances
    this.videoCircleStream;
    this.imageDataCtx;
    this.videoStream;
    this.attempts = 0;
    this.setupWaveForm = false;
    this.destroyed = false;
    this.errorCodes = ["TVER","PNTE" ,"NFEF","UNAC"];

    //assigns the this.type of action determined by the click
    this.init = function() {
      $('#options .item.voice').eq(0).click(function(){
        main.type.biometricType = 'voice';
        main.type.action = 'Enrollment';
        console.log(main.type);
        main.initiate();
      });
      $('#options .item.voice').eq(1).click(function(){
        main.type.biometricType = 'voice';
        main.type.action = 'Verification';
        main.initiate();
      });
      $('#options .item.face').eq(0).click(function(){
        main.type.biometricType = 'face';
        main.type.action = 'Enrollment';
        main.initiate();
      });
      $('#options .item.face').eq(1).click(function(){
        main.type.biometricType = 'face';
        main.type.action = 'Verification';
        main.initiate();
      });
      $('#options .item.video').eq(0).click(function(){
        main.type.biometricType = 'video';
        main.type.action = 'Enrollment';
        main.initiate();
      });
      $('#options .item.video').eq(1).click(function(){
        main.type.biometricType = 'video';
        main.type.action = 'Verification';
        main.initiate();
      });

      main.socket2.on('requestResponse', function(response){
        console.log(response);
            //check if it was deletion
            if(response.type == "deleteEnrollments"){
                main.handleDeletion(response);

            }
            //All other API call such as verifications, enrollments, etc.
            else {
              if (!main.destroyed){
            response = response.response;
            if (main.type.action == "Enrollment"){
              if (response.responseCode == "SUCC"){
                if(main.enrollCounter < 3){
                main.enrollCounter = main.enrollCounter + 1;
                console.log(main.enrollCounter);
                main.continueEnrollment(response);
                }
               } else {
                main.attempts++;
                if (main.attempts > main.MAX_ATTEMPTS){
                    main.waitj.fadeTo(500,0.0,function(){
                    $(this).css('display','none');
                    main.headerj.css('dislay','inline-block');
                    main.headerj.fadeTo(500,1.0);
                  });
                  main.headerj.text("Exceeded maximum attempts allowed. Please try later");
                } else {
                  console.log(main.enrollCounter);
                 main.continueEnrollment(response);
                    }
                  }
                }
               else if (main.type.action == "Verification") {
                    if (response.responseCode == "SUCC"){
                    main.handleResponse(response);
                    //do something after successful. Right now it just stays there
                    } else {
                    main.attempts++;
                    //continue to verify
                    if (main.attempts > main.MAX_ATTEMPTS){
                      //save the max attempts in the user session?
                      main.waitj.fadeTo(500,0.0,function(){
                      $(this).css('display','none');
                      main.headerj.css('dislay','inline-block');
                      main.headerj.fadeTo(500,1.0);
                      });
                      main.headerj.text("Exceeded maximum attempts allowed. Please try later");
                       }
                    else {
                      main.handleResponse(response);
                       if (!main.errorCodes.includes(response.responseCode)){
                        setTimeout(function(){
                        main.continueVerification(response);
                        },100);
                        }
                    }
                 }
          }
        }
      }
      });
      main.assignClicks();
    }


    this.assignClicks = function(){
        //Assigning the start() function to the read button
        $('#readyButton').click(
          function() {
            main.start();
          }
        );

        //warning overlay buttons
        $('.ic').eq(0).click(
        function(){
        $('#closeButton').click();
        }
        );

       //proceede for enrollment
        $('.ic').eq(1).click(
        function(){
          main.destroyed = false;
          var options = {biometricType: "delete", action: "Enrollments"};
              //Request deleteAllEnrollmentsForUser Call
              //Control now transferred to socket.on(..)
              main.socket2.emit('apiRequest', options);
              $('#warningOverlay > span').fadeTo(300,0.0);
              $('#warningOverlay > div').fadeTo(300,0.0,function(){
                $('#warningOverlay > span').css('display','none');
                $('#warningOverlay > div').css('display','none');
                main.wait2j.css('display', 'flex !important');
                main.wait2j.fadeTo(300,1.0);
              });
           });

         $('#videoModal')
        .modal({
          onHide: function() {
              main.destroy();
              }
         });

        //liveness
        $('#livenessToggle').eq(0).click(function(){
          main.liveness = !main.liveness;
        });

      }
        //called by the the start up buttons
        this.initiate = function (){
         main.createObjects();
          if (main.type.action == 'Enrollment'){
          main.showWarningOverlay();
            } else {
          main.warningOverlayj.css('display','none');
          }
          main.setup();
          //main.convertSVG();
      }

    this.createObjects = function(){
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
      main.overlayj= $('#overlay2').eq(0);
    }

    this.showWarningOverlay = function(){
        setTimeout(function(){
        main.wavej.css('opacity','0.0');
        main.vidFramej.css('opacity','0.0');
        main.readyButtonj.css('opacity','0.0');
        },200);
          main.wait2j.css('display','none');
          setTimeout(function(){
            $('#warningOverlay > div').fadeTo(600, 1.0);
            $('#warningOverlay > span').fadeTo(600, 1.0);
          },300);
        main.warningOverlayj.css('display','flex');
        main.warningOverlayj.css('opacity','1.0');
        main.readyButtonj.css('display','none');
    }

    this.handleDeletion = function(response){
             console.log('received response...');
             response = response.response;
              if(response.responseCode == "SUCC"){
                setTimeout(function(){
                main.warningOverlayj.fadeTo(500,0.0,function(){
                  if (main.type.biometricType == "voice"){
                    main.wavej.fadeTo(500,0.3);
                  } else {
                    main.vidFramej.fadeTo(500,1.0);
                  }
                main.readyButtonj.fadeTo(500,1.0);
                main.warningOverlayj.css('display','none');
                main.readyButtonj.css('display','block');
                });
                },1000);
              }  else {
                main.headerd
              }
    }

    this.handleResponse  = function(response) {
      setTimeout(function () {
      main.waitj.fadeTo(300,0.0, function() {
        $(this).css('display', 'none');
        main.headerj.css('display', 'inline-block');
        main.headerj.fadeTo(300, 1.0);
        });
        if (response.responseCode == "SUCC"){
          if (main.type.action == "Verification"){
            main.headerj.text(main.prompt.getPrompt("SUCC_V"));
          } else {
            main.headerj.text(main.prompt.getPrompt("SUCC_E"));
          }
        }
           else {
            main.headerj.text(main.prompt.getPrompt(response.responseCode));
          }
        }, 500);
      }

    this.continueEnrollment = function(response){
      console.log("continuing Enrollment...");
      //hanlde the response (can use handleresponse() method- will see it later on)
      if (main.type.biometricType !== "face"){
        if (response.responseCode == "SUCC"){
          if (main.enrollCounter == 1) {
             main.headerj.text(main.prompt.getPrompt("SUCC_E_1"));
           } else if (main.enrollCounter == 2){
            main.headerj.text(main.prompt.getPrompt("SUCC_E_2"));
           } else if (main.enrollCounter == 3){
             main.headerj.text(main.prompt.getPrompt("SUCC_E_3"));
            }
          }
            else {
           main.headerj.text(main.prompt.getPrompt(response.responseCode));
           }
           main.waitj.fadeTo(300,0.0, function() {
           main.waitj.css('display', 'none');
           main.headerj.css('display', 'inline-block');
           main.headerj.fadeTo(300, 1.0);
      });
    } else if (main.type.biometricType == "face") {
      if (response.responseCode == "SUCC"){
          main.headerj.text(main.prompt.getPrompt("SUCC_E_3"));
        }
        //handle re-recording and animations for face
     else {
        setTimeout(function(){
            main.circlej.fadeTo(350,0.0);
            main.headerj.fadeTo(500,0,function(){
            main.headerj.text(main.prompt.getPrompt("LOOK_INTO_CAM"));
            main.headerj.fadeTo(500,1.0,function(){
            main.circlej.circleProgress('redraw');
            main.circlej.circleProgress();
            main.circlej.circleProgress({value: 1.0, animation: {duration: 5000, easing:false}});
            main.circlej.fadeTo(350,1.0);
            });
          });
        main.overlayj.fadeTo(500,0.3,function(){
           main.player.record().start();
          });
        },2000);
        main.headerj.text(main.prompt.getPrompt(response.responseCode));
      }
        main.waitj.fadeTo(300,0.0, function() {
        main.waitj.css('display', 'none');
        main.headerj.css('display', 'inline-block');
        main.headerj.fadeTo(300, 1.0);
      });
    }

    //handle re-recording and prompts/animations along with it (for voice/video)
    if (main.enrollCounter < 3  && main.type.biometricType !== "face"){
      setTimeout(function(){
        main.circlej.fadeTo(350,0.0);
        main.headerj.fadeTo(350, 0.0,function(){
        if (main.enrollCounter == 0){
        main.headerj.text(main.prompt.getPrompt("ENROLL_0"));
        }
        if (main.enrollCounter == 1) {
        main.headerj.text(main.prompt.getPrompt("ENROLL_1"));
        } else if (main.enrollCounter == 2){
        main.headerj.text(main.prompt.getPrompt("ENROLL_2"));
        }
        main.headerj.fadeTo(350, 1.0,function(){
          if (main.type.biometricType !== "voice"){
            main.circlej.circleProgress('redraw');
            main.circlej.circleProgress();
            main.circlej.circleProgress({value: 1.0, animation: {duration: 5000, easing:false}});
            main.circlej.fadeTo(350,1.0);
      }
        });
        });
        if (main.type.biometricType == "voice"){
          main.circlej.css('opacity',0.0);
          main.player.record().start();
        main.wavej.fadeTo(200,1.0, function(){
        });
        } else if (main.type.biometricType == "video"){
        main.overlayj.fadeTo(500,0.3,function(){
        main.player.record().start();
          });
        }
       },2000);
      }
    }

    this.setup = function() {
          main.enrollCounter = 0;
          main.destroy();
          //set all to none to make sure
          main.waitj.css('display', 'none');
          main.circlej.css('display', 'none');
          main.vidCirclej.css('display', 'none');
          main.headerj.text("");
          main.headerj.css('display','none');
          main.readyButtonj.css('display', 'inline-block');
          main.overlayj.css('opacity', '0');
          main.showLoadingOverlay();
          if (main.type.biometricType == "voice"){
            main.handleVoiceSetup();
          } else if (main.type.biometricType == "face"){
            main.handleFaceSetup();
          } else {
             main.handleVideoSetup();
          }
        }

    //ready up animations and stuff for voice enroll/verific.
    this.handleVoiceSetup = function (){
      main.headerj.css('opacity','0.0');
      main.attempts = 0;
      main.vidCirclej.css('display','none');
      console.log('initiating prerequisites for voice..');
         main.createWaveform();
         main.initVoiceRecord();
         if (!main.setupVJS){
           main.setupListners();
          }
          main.wavej.css("display","block");
          main.wavej.fadeTo(800,0.3);
                   window.setTimeout(function() {
                  $("button[title='Device']").eq(0).click();
                   }, 500);
                   main.circlej.css("display","none");
                   main.vidFramej.css('display', 'none');
                   //   $("#waveform").fadeTo(2000, 0.6);
                   $('#videoModal').modal('show');
      }

    //ready up animations and stuff for face enroll/verific.
    this.handleFaceSetup = function(){
      main.attempts = 0;
      main.circlej.css('display','block');
      main.circlej.css('opacity','0.0');
      main.headerj.css('opacity','0.0');
            console.log('initiating prerequisites for face..');
              $ ('#imageData').css('display','block');
              main.wavej.css('display','none');
              main.initFaceRecord();
              if (!this.setupVJS){
                main.setupListners();
              }
              window.setTimeout(function() {
                $("button[title='Device']").eq(0).click();
              }, 500);
              main.vidFramej.css('display', 'none');
              main.createVideo();
              main.vidCirclej.css('display','none');
              main.overlayj.css('opacity', '1.0');
              $('#videoModal').modal('show');
              main.readyButtonj.css('opacity',0.0);
              main.readyButtonj.fadeTo(550,1.0);
              main.vidFramej.css('opacity','0.0');
              main.vidFramej.fadeTo(550,1.0);
              if (main.liveness){
                liveness();
              }
            }

    //ready up animations and stuff for video enroll/verific.
    this.handleVideoSetup = function(){
        main.attempts = 0;
              main.headerj.css('opacity','0.0');
              main.circlej.css('opacity','0.0');
            console.log('initiating prerequisites for video..');
              main.vidFramej.css('display','block');
              main.vidFramej.fadeTo(500,1.0);
              main.wavej.css('display','none');
              main.initVideoRecord();
              if (!main.setupVJS){
                main.setupListners();
              }
              window.setTimeout(function() {
                $("button[title='Device']").eq(0).click();
              }, 500);
              main.createVideo();
      main.circlej.css('display','block');
              main.overlayj.css('opacity', '1.0');
              $('#videoModal').modal('show');
              main.wavej.css('display', 'none');
              }

    this.createVideo = function() {
      var webcam = document.querySelector('#myVideo');
      var imageData		= document.getElementById("imageData");
      main.imageDataCtx		= imageData.getContext("2d");
      navigator.mediaDevices.getUserMedia({ audio: false, video: {height: 480, width: 640}}).then(
          function(stream) {

             webcam.srcObject = stream;
             webcam.onloadedmetadata = function(e) {
             imageData.width	= webcam.videoWidth;
             imageData.height	= webcam.videoHeight;
             webcam.play();
             main.videoStream = stream;
             }
           }
          ).catch(function(err){
             console.log(err);
          }
        );
        function drawFrames(){
          //mirror the video by drawing it onto the canvas
         main.imageDataCtx.setTransform(-1.0, 0, 0, 1, webcam.videoWidth, 0);
         main.imageDataCtx.drawImage(webcam, 0, 0, webcam.videoWidth, webcam.videoHeight);
          window.requestAnimationFrame(drawFrames);
        }
        drawFrames();
      }

    //set up video JS for vocie
    this.initVoiceRecord = function () {
     if ($('#myAudio').length == 0){
      var audio = $('<audio />').appendTo('body');
      audio.attr('id','myAudio');
      audio.attr('class','video-js vjs-default-skin');
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
      }, function(){
          // print version information at startup
          var msg = 'Using video.js ' + videojs.VERSION;
          videojs.log(msg);
      });
    // }
    }

    //set up video JS for viideo
    this.initVideoRecord = function () {
     if ($('#video2').length == 0){
      var audio = $('<audio />').appendTo('body');
      audio.attr('id','video2');
      audio.attr('class','video-js vjs-default-skin');
     }
        main.player = videojs('video2', {
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
       }, function(){
           //print version information at startup
           var msg = 'Using video.js ' + videojs.VERSION;
           videojs.log(msg);
       });
      // }
    }

    //set up video JS for face
    this.initFaceRecord = function () {
     if ($('#video3').length == 0){
      var audio = $('<audio />').appendTo('body');
      audio.attr('id','video3');
      audio.attr('class','video-js vjs-default-skin');
     }
      main.player = videojs('video3', {
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
      }, function(){
        // print version information at startup
        var msg = 'Using video.js ' + videojs.VERSION;
        videojs.log(msg);
      });
    // }
    }

    //one-time setup for the listners to prevent duplicate api calls/records
    this.setupListners = function (){
         main.player.on('deviceError', function() {
           console.log('device error:', main.player.deviceErrorCode);
         });
         main.player.on('error', function(error) {
           console.log('error:', error);
         });
         // user this.type the record button and started recording
        main.player.on('startRecord', function() {
          if (main.liveness){
            main.socket2.emit('timestamp', 1);
          }
         });

         //recording is available
        main.player.on('finishRecord', function() {
          if (main.liveness){
            main.socket2.emit('recording',main.player.recordedData);
          }
          if (main.type.biometricType == "voice"){
            main.wavej.fadeTo(300,0.3);
          } else if (main.type.biometricType == "video") {
            main.vidCirclej.fadeTo(300,0.3);
            main.overlayj.fadeTo(300,1.0);
          } else {
            main.overlayj.fadeTo(300,1.0);
          }
           var options = {biometricType: main.type.biometricType, action: main.type.action, recording: main.player.recordedData};
           main.socket2.emit('apiRequest', options);
           main.headerj.fadeTo(300, 0.0, function() {
              $(this).css('display', 'none');
              main.waitj.css('display', 'inline-block');
              main.waitj.fadeTo(300,1.0);
             });
           });
         //to ensure one-time assignment to the listeners
         main.setupVJS = true;
       }

       $('#closeButton').click(function(){
         main.destroy();
       });


    this.start = function () {
      main.headerj.css('display','inline-block');
      main.headerj.css('opacity', '0.0');
      main.headerj.fadeTo(1000,1.0);
      if (main.type.biometricType !== "face"){
        main.headerj.text("Please say: " + main.prompt.getPhrase(0));
      }  else {
        main.headerj.text(this.prompt.getPrompt("LOOK_INTO_CAM"));
      }
      if (main.type.biometricType == "voice"){
           main.circlej.css("display","none");
           main.wavej.fadeTo(500,1.0);
         }
         if (!main.liveness){
            if (main.type.biometricType == "face"){
                main.createCircle();
                main.circlej.css("opacity","1.0");
                main.circlej.circleProgress('redraw');
                main.circlej.circleProgress();
                main.circlej.circleProgress({value: 1.0, animation: {duration: 5200, easing:false}});
                console.log("creating circle");
              } else if (main.type.biometricType == "video"){
                console.log("createed video circle");
                main.createVideoCircle();
                main.vidCirclej.css('display','block');
                main.vidCirclej.fadeTo(500,0.5);
                main.createCircle();
                main.circlej.circleProgress('redraw');
                main.circlej.circleProgress();
                main.circlej.circleProgress({value: 1.0, animation: {duration: 5200, easing:false}});
                main.circlej.css("display","block");
                main.circlej.css("opacity","1.0");
          }
          main.overlayj.fadeTo(1500, 0.3);
          main.readyButtonj.css('display', 'none');
          main.player.record().start();
        } else {
          //further liveness
        }
      }

    //continue verification if errors, response codes, etc
    this.continueVerification = function (response){
        setTimeout(function(){
        main.circlej.fadeTo(350,0.0);
        main.headerj.fadeTo(350, 0.0,function(){
          if (main.type.biometricType == "face"){
          main.headerj.text(main.prompt.getPrompt("LOOK_INTO_CAM"));
          } else {
          main.headerj.text(main.prompt.getPrompt("VERIFY"));
          }
          main.headerj.fadeTo(350,1.0);
        });
        if (main.type.biometricType == "voice"){
          main.circlej.css('opacity','0.0');
             main.wavej.fadeTo(500,1.0, function(){
            main.player.record().start();
          });
        } else {
          main.circlej.fadeTo(350,0.0);
          main.overlayj.fadeTo(500,0.3, function(){
          main.player.record().start();
          main.circlej.fadeTo(350,1.0);
          main.circlej.circleProgress('redraw');
          main.circlej.circleProgress();
          main.circlej.circleProgress({value: 1.0, animation: {duration: 5000, easing:false}});
          });
        }
      },2000);
    }

    //show this before verification with liveness
    this.showLoadingOverlay = function (){
      if (main.type.action !== "Enrollment"){
      var timeOut = 1000;
      main.vidFramej.css('opacity','0.0');
      main.wavej.css('opacity','0.0');
      main.warningOverlayj.css('display','flex');
      main.warningOverlayj.css('opacity','1.0');
      main.wait2j.css('opacity', 0.0);
      main.wait2j.css('display','none');
      $('#warningOverlay > div').css('display','none');
      $('#warningOverlay > span').css('display','none');
        main.wait2j.css('opacity','0.0');
        main.wait2j.css('display','flex');
        main.wait2j.fadeTo(500,1.0);
        setTimeout(function(){
          main.warningOverlayj.fadeTo(350, 0.0, function(){
            main.warningOverlayj.css('display','none');
            main.destroyed = false;
          });
        },timeOut);
       }
    }

    //create the surrounding
    this.createCircle = function () {
        main.circlej.circleProgress({
         value: 1.0,
         size: 268,
         fill: {
           color: "rgb(251,193,50)"
         },
         startAngle : 0,
         thickness: 5,
         lineCap: "round",
         animation: {duration: 4800, easing: "linear"}
       });
      }

    //create the audio waveform
    this.createWaveform  = function () {
      if (!main.setupWaveForm){
          var colors =  ['#fb6d6b', '#c10056',' #a50053', '#51074b'];
          var canvas = document.querySelector('#waveform');
          if (typeof main.vudio == "undefined"){
          console.log("created again");
          main.vudio = new Vudio(canvas, {
          effect: 'waveform',
          accuracy: 512,
          width: 512,
          height: 300,
          waveform: {
            maxHeight : 200,
            color: colors
            }
        });
      }
      main.setupWaveForm = true;
    }
      }

    //destroy video,canvas, and other objects
    this.destroy = function (){
        if(typeof main.player !== "undefined"){
          console.log("destroying instances");
          main.player.record().destroy();
          main.player = undefined;
        }
        main.setupVJS = false;
        $("#circle").css('display','none');
        main.readyButtonj.css('display','none');
        main.destroyed = true;

    //////////// The ones below either have a jutter, or are unable to restart the streams- will come back later/////////
    ////////////The solution is, I think, to destroy the html elements associated to the objects, then recreate them and add them the DOM/////////

      //stop  the audio stream for the waveform circle
      // if (this.typeof vudio !== "undefined"){
      // vudio.stream.stop();
      //  }

      // //clear the canvas after done with video
      // if (this.typeof imageDataCtx !== "undefined"){
      //   var canvas = document.getElementById("imageData");
      //   imageDataCtx.clearRect(0, 0, canvas.width, canvas.height);
      // }
      // //stop the video stream for the video
      // if (this.typeof videoStream !== "undefined"){
      //   videoStream.stop();
      // };

      //stop the audio stream for the video circle- not working properly, will come back
      // if (this.typeof vidCircle !== "undefined"){
      // videoCircleStream.stop();
      // console.log(videoCircleStream.getTracks());
      // }
    }

    //creates the circular audio waveform around video (verification/enrollment)
    this.createVideoCircle  = function (){
            var analyser;
            var amp;
            var vol2;
            if (!main.vidCircle){
            main.vidCircle =  $("#testSound").eq(0);


            navigator.mediaDevices.getUserMedia({audio: true, video: false})
            .then(function(stream) {
              var context = new AudioContext();
              analyser = context.createAnalyser();
              analyser.smoothingTimeConstant = 0.85;
              var microphone = context.createMediaStreamSource(stream);
              microphone.connect(analyser);
              analyser.minDecibels = -95;
              amp = new Uint8Array(analyser.frequencyBinCount);
              main.videoCircleStream  = stream;
              window.requestAnimationFrame(draw);
            }).catch(function(err){
              console.log("error buddy: " + err);
            });
            var draw = function (vol) {
            analyser.getByteFrequencyData(amp);
            var vol = getRMS(amp);
            if (vol > 120) { //max Volume
              vol = 120;
            }
            vol = (vol * 2 )/ 5;
            vol = (vol + 130); //fit to the overlay
            main.vidCircle.attr('r',vol);
            window.requestAnimationFrame(draw);
            }

            //helper to get the net audio volume
            function getRMS (spectrum) {
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
}
