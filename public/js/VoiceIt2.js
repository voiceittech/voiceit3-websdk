function voiceIt2(){

    var mainThis = this;
    this.video;
    this.player;
    this.socket2 = io.connect('http://localhost:8000',{reconnection:true, reconnectionDelay: 1, randomizationFactor: 0, reconnectionDelayMax: 1});
    this.enrollCounter = 0;
    this.prompt = new prompts();
    this.type = [];
    this.setupVJS = false;
    this.MAX_ATTEMPTS = 3;

    //needed for the audio/video streams 
    this.vudio;
    this.circle1 = undefined;
    this.videoCircleStream;
    this.imageDataCtx;
    this.videoStream;
    this.attempts = 0;
    this.setupWaveForm = false;
    this.destroyed = false;

    //anonymous funct. to tidy up stuff
    //assigns the this.type of action determined by the click 
    this.assigntype = function() {
      $('#options .item.voice').eq(0).click(function(){
        mainThis.type[0] = 'voice';
        mainThis.type[1] = 'Enrollment';
        mainThis.initiate();
      });
      $('#options .item.voice').eq(1).click(function(){
        mainThis.type[0] = 'voice';
        mainThis.type[1] = 'Verification';
        mainThis.initiate();
      });
      $('#options .item.face').eq(0).click(function(){
        mainThis.type[0] = 'face';
        mainThis.type[1] = 'Enrollment';
        mainThis.initiate();
      });
      $('#options .item.face').eq(1).click(function(){
        mainThis.type[0] = 'face';
        mainThis.type[1] = 'Verification';
        mainThis.initiate();
      });
      $('#options .item.video').eq(0).click(function(){
        mainThis.type[0] = 'video';
        mainThis.type[1] = 'Enrollment';
        mainThis.initiate();
      });
      $('#options .item.video').eq(1).click(function(){
        mainThis.type[0] = 'video';
        mainThis.type[1] = 'Verification';
        mainThis.initiate();
      });

      //Assigning the start() function to the read button
      $('#readyButton').click(
          function() {
            mainThis.start();
          }
        );

      //warning overlay buttons 
      $('.ic').eq(0).click(
        function(){
        $('#closeButton').click();
        }
      );

      $("input[type='checkbox']").eq(0).click(function(){
        setTimeout(function(){
          if ($("input[type='checkbox']")[0].checked){
          $("input[type='checkbox']").click();
          $('#comingSoon').fadeTo(250,1.0);
          }
        },250);
      });

      //proceede for enrollment
      $('.ic').eq(1).click(
        function(){
          mainThis.destroyed = false;
          var type = ['delete', 'Enrollments'];
          var array = [type,0,0];
              //Request deleteAllEnrollmentsForUser Call
              //Control now transferred to socket.on(..) 
              mainThis.socket2.emit('apiRequest', array);
              $('#warningOverlay > span').fadeTo(300,0.0);
              $('#warningOverlay > div').fadeTo(300,0.0,function(){
                $('#warningOverlay > span').css('display','none');
                $('#warningOverlay > div').css('display','none');
                $('#wait2').css('display', 'flex !important');
                $('#wait2').fadeTo(300,1.0);
              });
          });

      $('#videoModal')
      .modal({
          onHide: function() {
              mainThis.destroy();
              }
        });

      mainThis.socket2.on('requestResponse', function(response){

            //check if it was deletion
            if(response[1] == "deleteEnrollments"){
                mainThis.handleDeletion(response);

            }  
            //All other API call such as verifications, enrollments, etc.
            else {
              if (!mainThis.destroyed){
            response = response[0];
            if (mainThis.type[1] == "Enrollment"){
              if (response.responseCode == "SUCC"){
                if(mainThis.enrollCounter < 3){
                mainThis.enrollCounter = mainThis.enrollCounter + 1;
                console.log(mainThis.enrollCounter);
                mainThis.continueEnrollment(response);
                }
               } else {
                mainThis.attempts++;
                if (mainThis.attempts > mainThis.MAX_ATTEMPTS){
                    $('#wait').fadeTo(500,0.0,function(){
                    $(this).css('display','none');
                    $('#header').css('dislay','inline-block');
                    $('#header').fadeTo(500,1.0);
                  });
                  $('#header').text("Exceeded maximum attempts allowed. Please try later");
                } else {
                  console.log(mainThis.enrollCounter);
                 mainThis.continueEnrollment(response);
                    }
                  }
                } 
               else if (mainThis.type[1] == "Verification") {
                  mainThis.handleResponse(response);
                      if (response.responseCode == "SUCC"){
                       //do something after successful
                      } else {
                      mainThis.attempts++;
                     //continue to verify
                     if (mainThis.attempts >= mainThis.MAX_ATTEMPTS){
                        //save the max attempts in the user session?
                        $('#wait').fadeTo(500,0.0,function(){
                        $(this).css('display','none');
                        $('#header').css('dislay','inline-block');
                        $('#header').fadeTo(500,1.0);
                        });
                        $('#header').text("Exceeded maximum attempts allowed. Please try later");
                         } 
                      else {
                       if (response.responseCode !== "TVER" && response.responseCode !== "PNTE" && response.responseCode !== "NFEF" && response.responseCode !== "UNAC"){
                        setTimeout(function(){
                        mainThis.continueVerification(response);
                        },100);
                        }
                    }
                 }
          }
        }
      }
      });
    }

      //called by the the start up buttons
      this.initiate = function (){
        if (mainThis.type[1] == 'Enrollment'){
         setTimeout(function(){
        $('#waveform').css('opacity','0.0');
        $('#imageData').css('opacity','0.0');
        $('#readyButton').css('opacity','0.0');
        },200);
          $('#wait2').css('display','none');
          setTimeout(function(){
            $('#warningOverlay > div').fadeTo(600, 1.0);
            $('#warningOverlay > span').fadeTo(600, 1.0);
          },300);
        $('#warningOverlay').css('display','flex');
        $('#warningOverlay').css('opacity','1.0');
        $('#readyButton').css('display','none');
        } else {
        $('#warningOverlay').css('display','none');
        }
        mainThis.setup();
        //mainThis.convertSVG();
      }

    this.handleDeletion = function(response){
             console.log('received response...');
              if(response[0].responseCode == "SUCC"){
                setTimeout(function(){
                $('#warningOverlay').fadeTo(500,0.0,function(){
                  if (mainThis.type[0] == "voice"){
                    $('#waveform').fadeTo(500,0.3);
                  } else {
                    $('#imageData').fadeTo(500,1.0);
                  }
                $('#readyButton').fadeTo(500,1.0);
                $('#warningOverlay').css('display','none');
                $('#readyButton').css('display','block');
                });
                },1000);
              }  else {
                //could not delete enrollemts!
              }
    }

    this.handleResponse  = function(response) {
      setTimeout(function () {
      $('#wait').fadeTo(300,0.0, function() {
        $(this).css('display', 'none');
        $('#header').css('display', 'inline-block');
        $('#header').fadeTo(300, 1.0);
        });
        if (response.responseCode == "SUCC"){
          if (mainThis.type[1] == "Verification"){
            $('#header').text(mainThis.prompt.getPrompt("SUCC_V"));
          } else {
            $('#header').text(mainThis.prompt.getPrompt("SUCC_E"));
          }
        }
           else {
            $('#header').text(mainThis.prompt.getPrompt(response.responseCode));
          }
        }, 500);
      }

    this.continueEnrollment = function(response){
      console.log("continuing Enrollment...");
      //hanlde the response (can use handleresponse() method- will see it later on)
      if (mainThis.type[0] !== "face"){
        if (response.responseCode == "SUCC"){
          if (mainThis.enrollCounter == 1) {
             $('#header').text(mainThis.prompt.getPrompt("SUCC_E_1"));
           } else if (mainThis.enrollCounter == 2){
            $('#header').text(mainThis.prompt.getPrompt("SUCC_E_2"));
           } else if (mainThis.enrollCounter == 3){
             $('#header').text(mainThis.prompt.getPrompt("SUCC_E_3"));
            } 
          }
            else {
           $('#header').text(mainThis.prompt.getPrompt(response.responseCode));
           }
           $('#wait').fadeTo(300,0.0, function() {
           $('#wait').css('display', 'none');
           $('#header').css('display', 'inline-block');
           $('#header').fadeTo(300, 1.0);
      });
    } else if (mainThis.type[0] == "face") {
      if (response.responseCode == "SUCC"){
          $('#header').text(mainThis.prompt.getPrompt("SUCC_E_3"));
        }
        //handle re-recording and animations for face
     else {
        setTimeout(function(){
            $('#circle').fadeTo(350,0.0);
            $('#header').fadeTo(500,0,function(){
            $('#header').text(mainThis.prompt.getPrompt("LOOK_INTO_CAM"));
            $('#header').fadeTo(500,1.0,function(){
            $('#circle').circleProgress('redraw');
            $('#circle').circleProgress();
            $('#circle').circleProgress({value: 1.0, animation: {duration: 5000, easing:false}});
            $('#circle').fadeTo(350,1.0);
            });
          });
        $('#overlay2').fadeTo(500,0.3,function(){
           mainThis.player.record().start();
          });
        },2000);
        $('#header').text(mainThis.prompt.getPrompt(response.responseCode));
      }
        $('#wait').fadeTo(300,0.0, function() {
        $('#wait').css('display', 'none');
        $('#header').css('display', 'inline-block');
        $('#header').fadeTo(300, 1.0);
      });
    }

    //handle re-recording and prompts/animations along with it (for voice/video)
    if (mainThis.enrollCounter < 3  && mainThis.type[0] !== "face"){
      setTimeout(function(){
        $('#circle').fadeTo(350,0.0);
        $('#header').fadeTo(350, 0.0,function(){
        if (mainThis.enrollCounter == 0){
        $('#header').text(mainThis.prompt.getPrompt("ENROLL_0"));
        }
        if (mainThis.enrollCounter == 1) {
        $('#header').text(mainThis.prompt.getPrompt("ENROLL_1"));
        } else if (mainThis.enrollCounter == 2){
        $('#header').text(mainThis.prompt.getPrompt("ENROLL_2"));
        } 
        $('#header').fadeTo(350, 1.0,function(){
          if (mainThis.type[0] !== "voice"){
            $('#circle').circleProgress('redraw');
            $('#circle').circleProgress();
            $('#circle').circleProgress({value: 1.0, animation: {duration: 5000, easing:false}});
            $('#circle').fadeTo(350,1.0);
      }
        });
        });
        if (mainThis.type[0] == "voice"){
          $('#circle').css('opacity',0.0);
          mainThis.player.record().start();
        $('#waveform').fadeTo(200,1.0, function(){
        });
        } else if (mainThis.type[0] == "video"){
        $('#overlay2').fadeTo(500,0.3,function(){
           mainThis.player.record().start();
          });
        }
       },2000);
      }
    }
          
    this.setup = function() {
          mainThis.enrollCounter = 0;
          mainThis.destroy();
          //set all to none to make sure
          $('#wait').css('display', 'none');
          $('#circle').css('display', 'none');
          $('#videoCircle').css('display', 'none');
          $('#header').text("");
          $('#header').css('display','none');
          $('#readyButton').css('display', 'inline-block');
          $('#overlay2').css('opacity', '0');
          mainThis.showLoadingOverlay();
          if (mainThis.type[0] == "voice"){
            mainThis.handleVoiceSetup();
          } else if (mainThis.type[0] == "face"){
            mainThis.handleFaceSetup();
          } else {
            mainThis.handleVideoSetup();
          }
        }

    //ready up animations and stuff for voice enroll/verific.
    this.handleVoiceSetup = function (){
      $('#header').css('opacity','0.0');
      mainThis.attempts = 0;
      $('#videoCircle').css('display','none');
      console.log('initiating prerequisites for voice..');
         mainThis.createWaveform();
         mainThis.initVoiceRecord();
         if (!mainThis.setupVJS){
           mainThis.setupListners();
          }
          $('#waveform').css("display","block");
          $('#waveform').fadeTo(800,0.3);
                   window.setTimeout(function() {
                  $("button[title='Device']").eq(0).click();
                   }, 500);
                   $('#circle').css("display","none");
                   $('#imageData').css('display', 'none');
                   //   $("#waveform").fadeTo(2000, 0.6);
                   $('#videoModal').modal('show');
      }

    //ready up animations and stuff for face enroll/verific.
    this.handleFaceSetup = function(){
      mainThis.attempts = 0;
      $('#circle').css('display','block');
      $('#circle').css('opacity','0.0');
      $('#header').css('opacity','0.0');
            console.log('initiating prerequisites for face..');
              $ ('#imageData').css('display','block');
              $('#waveform').css('display','none');
              mainThis.initFaceRecord();
              if (!this.setupVJS){
                mainThis.setupListners();
              }
              window.setTimeout(function() {
                $("button[title='Device']").eq(0).click();
              }, 500);
              // if ($("input[type='checkbox']")[0].checked){
              //    //createVideo();
              // liveness();
              // } else {
              $('#imageData').css('display', 'none');
              mainThis.createVideo();
              // }
              $('#videoCircle').css('display','none');
              $('#overlay2').css('opacity', '1.0');
              $('#videoModal').modal('show');
              $('#readyButton').css('opacity',0.0);
              $('#readyButton').fadeTo(550,1.0);
              $('#imageData').css('opacity','0.0');
              $('#imageData').fadeTo(550,1.0);
              // if (!$("input[type='checkbox']")[0].checked){
              // }
            }

    //ready up animations and stuff for video enroll/verific.
    this.handleVideoSetup = function(){
        mainThis.attempts = 0;
              $('#header').css('opacity','0.0');
              $('#circle').css('opacity','0.0');
            console.log('initiating prerequisites for video..');
              $('#imageData').css('display','block');
              $('#imageData').fadeTo(500,1.0);
              $('#waveform').css('display','none');
              mainThis.initVideoRecord();
              if (!mainThis.setupVJS){
                mainThis.setupListners();
              }
              window.setTimeout(function() {
                $("button[title='Device']").eq(0).click();
              }, 500);
              // if ($("input[type='checkbox']")[0].checked){
              //   //createVideo();
              //     if (mainThis.type[1] == "Verification"){
              //       liveness();
              //     } else {
              //       mainThis.createVideo();
              //     }
              // } else {
              mainThis.createVideo();
              // }
      $('#circle').css('display','block');
              $('#overlay2').css('opacity', '1.0');
              $('#videoModal').modal('show');
              $('#waveform').css('display', 'none');
              }

    this.createVideo = function() {
      var webcam = document.querySelector('#myVideo');
      var imageData		= document.getElementById("imageData");
      mainThis.imageDataCtx		= imageData.getContext("2d");
      navigator.mediaDevices.getUserMedia({ audio: false, video: {height: 480, width: 640}}).then(
          function(stream) {

             webcam.srcObject = stream;
             webcam.onloadedmetadata = function(e) {
             imageData.width	= webcam.videoWidth;
             imageData.height	= webcam.videoHeight;
             webcam.play();
             mainThis.videoStream = stream;
             }
           }
          ).catch(function(err){
             console.log(err);
          }
        );
        function drawFrames(){
          //mirror the video by drawing it onto the canvas 
         mainThis.imageDataCtx.setTransform(-1.0, 0, 0, 1, webcam.videoWidth, 0);
         mainThis.imageDataCtx.drawImage(webcam, 0, 0, webcam.videoWidth, webcam.videoHeight);
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
      mainThis.player = videojs('myAudio', {
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
        mainThis.player = videojs('video2', {
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
      mainThis.player = videojs('video3', {
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
         mainThis.player.on('deviceError', function() {
           console.log('device error:', mainThis.player.deviceErrorCode);
         });
         mainThis.player.on('error', function(error) {
           console.log('error:', error);
         });
         // user this.type the record button and started recording
        mainThis.player.on('startRecord', function() {
          console.log('started recording!');
         });
         //recording is available
        mainThis.player.on('finishRecord', function() {
          if (mainThis.type[0] == "voice"){
            $('#waveform').fadeTo(300,0.3);
          } else if (mainThis.type[0] == "video") {
            $('#videoCircle').fadeTo(300,0.3);
            $('#overlay2').fadeTo(300,1.0);
          } else {
            $('#overlay2').fadeTo(300,1.0);
          }
           var array = [mainThis.type, "en-US", mainThis.player.recordedData, mainThis.prompt.getPhrase(0)];
           mainThis.socket2.emit('apiRequest', array);
           $('#header').fadeTo(300, 0.0, function() {
              $(this).css('display', 'none');
              $('#wait').css('display', 'inline-block');
              $('#wait').fadeTo(300,1.0);
             });
           });
         //to ensure one-time assignment to the listeners 
         mainThis.setupVJS = true;
       }

       $('#closeButton').click(function(){
         mainThis.destroy();
       });


    this.start = function () {
      $('#header').css('display','inline-block');
      $('#header').css('opacity', '0.0');
      $('#header').fadeTo(1000,1.0); 
      if (mainThis.type[0] !== "face"){
        $('#header').text("Please say: " + mainThis.prompt.getPhrase(0));
      }  else {
        $('#header').text(this.prompt.getPrompt("LOOK_INTO_CAM"));
      }
      if (mainThis.type[0] == "voice"){
           $('#circle').css("display","none");
           $('#waveform').fadeTo(500,1.0);
         } 
      else if (mainThis.type[0] == "face"){
              // if ($("input[type='checkbox']")[0].checked){
              //    //face liveness
              //  } else {

                   mainThis.createCircle();
                  $('#circle').css("opacity","1.0");
                 $('#circle').circleProgress('redraw');
                 $('#circle').circleProgress();
                 $('#circle').circleProgress({value: 1.0, animation: {duration: 5000, easing:false}});
                  console.log("creating circle");
                  // }
      } else if (mainThis.type[0] == "video"){
                  console.log("createed video circle");
                  // if ($("input[type='checkbox']")[0].checked){
                  // } else {
                  mainThis.createVideoCircle();
                  // }
                  $('#videoCircle').css('display','block');
                  $('#videoCircle').fadeTo(500,0.5);
                  // if ($("input[type='checkbox']")[0].checked){
                  //   //video liveness
                  // } else {
                   mainThis.createCircle();
                 $('#circle').circleProgress('redraw');
                 $('#circle').circleProgress();
                 $('#circle').circleProgress({value: 1.0, animation: {duration: 5000, easing:false}});
                 $('#circle').css("display","block");
                 $('#circle').css("opacity","1.0");
             // }
          }
        $('#overlay2').fadeTo(1500, 0.3);
        $('#readyButton').css('display', 'none');
        mainThis.player.record().start();
      }

    //continue verification if errors, response codes, etc
    this.continueVerification = function (response){
        setTimeout(function(){
        $('#circle').fadeTo(350,0.0);
        $('#header').fadeTo(350, 0.0,function(){
          if (mainThis.type[0] == "face"){
          $('#header').text(mainThis.prompt.getPrompt("LOOK_INTO_CAM"));
          } else {
          $('#header').text(mainThis.prompt.getPrompt("VERIFY"));
          }
          $('#header').fadeTo(350,1.0);
        });
        if (mainThis.type[0] == "voice"){
          $('#circle').css('opacity','0.0');
          $('#waveform').fadeTo(500,1.0, function(){
            mainThis.player.record().start();
          });
        } else {
          $('#circle').fadeTo(350,0.0);
          $('#overlay2').fadeTo(500,0.3, function(){
          mainThis.player.record().start();
          $('#circle').fadeTo(350,1.0);
          $('#circle').circleProgress('redraw');
          $('#circle').circleProgress();
          $('#circle').circleProgress({value: 1.0, animation: {duration: 5000, easing:false}});
          });
        }
      },2000);
    }

    //show this before verification with liveness 
    this.showLoadingOverlay = function (){
      if (mainThis.type[1] !== "Enrollment"){
      var timeOut = 1000;
      $('#imageData').css('opacity','0.0');
      $('#waveform').css('opacity','0.0');
      $('#warningOverlay').css('display','flex');
      $('#warningOverlay').css('opacity','1.0');
      $('#wait2').css('opacity', 0.0);
      $('#wait2').css('display','none');
      $('#warningOverlay > div').css('display','none');
      $('#warningOverlay > span').css('display','none');
     //  if ($("input[type='checkbox']")[0].checked && mainThis.type[0] !== "voice"){
     //    timeOut = 2500;
     //    $('#warnText').text("Please wait while we load resources");
     //    $('#warningOverlay > span').fadeTo(500,1.0);
     //  setTimeout(function(){
     //  $('#warningOverlay > span').fadeTo(300,0.0, function(){
     //  $('#warningOverlay').css('display','none');
     //  $('#imageData').fadeTo(350,1.0);
     //  });
     // },timeOut);
     //  } 
       // if (mainThis.type[0] == "voice") {
        $('#wait2').css('opacity','0.0');
        $('#wait2').css('display','flex');
        $('#wait2').fadeTo(500,1.0);
        setTimeout(function(){
          $('#warningOverlay').fadeTo(350, 0.0, function(){
            $('#warningOverlay').css('display','none');
            mainThis.destroyed = false;
          });
        },timeOut);
       } 
     // }
    }

    //create the surrounding
    this.createCircle = function () {
        $('#circle').circleProgress({
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
      if (!mainThis.setupWaveForm){
          var colors =  ['#fb6d6b', '#c10056',' #a50053', '#51074b'];
          var canvas = document.querySelector('#waveform');
          if (typeof mainThis.vudio == "undefined"){
          console.log("created again");
          vudio = new Vudio(canvas, {
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
      mainThis.setupWaveForm = true;
    }
      }

    //destroy video,canvas, and other objects
    this.destroy = function (){
        if(typeof mainThis.player !== "undefined"){
          console.log("destroying instances");
          mainThis.player.record().destroy();
          mainThis.player = undefined;
        }
        mainThis.setupVJS = false;
        $("#circle").css('display','none');
        $('#readyButton').css('display','none');
        mainThis.destroyed = true;

              //////////////////// The ones below either have a jutter, or are unable to restart the streams- will come back later///////////////
          ////////////////////The solution is, I think, to destroy the html elements associated to the objects, then recreate them and add them the DOM//////////////

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
      // if (this.typeof circle1 !== "undefined"){
      // videoCircleStream.stop();
      // console.log(videoCircleStream.getTracks());
      // }
    }

    //creates the circular audio waveform around video (verification/enrollment)
    this.createVideoCircle  = function (){
            var analyser;
            var amp;
            var vol2;
            if (!mainThis.circle1){
            mainThis.circle1 =  $("#testSound").eq(0);


            navigator.mediaDevices.getUserMedia({audio: true, video: false})
            .then(function(stream) {
              var context = new AudioContext();
              analyser = context.createAnalyser();
              analyser.smoothingTimeConstant = 0.85;
              var microphone = context.createMediaStreamSource(stream);
              microphone.connect(analyser);
              analyser.minDecibels = -95;
              amp = new Uint8Array(analyser.frequencyBinCount);
              mainThis.videoCircleStream  = stream;
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
            mainThis.circle1.attr('r',vol);
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
