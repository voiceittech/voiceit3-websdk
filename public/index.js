function authenticationAPICall() {
  var http = new XMLHttpRequest();
  http.open("POST", "/authenticate", true);
  http.setRequestHeader('Content-Type', 'application/json');
  http.send(JSON.stringify(values));
}

$(document)
  .ready(function() {
    $('#loading').css('opacity', '0.0');
    var liveness = $('#livenessToggle').is(':checked') ? true: false;

    $('#livenessToggle').eq(0).click(function() {
      liveness = $(this).is(':checked')? true: false;
    });

    var voiceItHTML = new voiceIt2FrontEndBase();
    voiceItHTML.init();
    voiceItHTML.onLoad = function(){
      $("#voiceEnrollmentBtn").on('click', function() {
        voiceItHTML.init_Voice_Enrollment();
      });
      $("#voiceVerificationBtn").on('click', function() {
        voiceItHTML.init_Voice_Verification();
      });
      $("#faceVerificationBtn").on('click', function() {
        voiceItHTML.init_Face_Verification(liveness);
      });

      $("#faceEnrollmentBtn").on('click', function() {
        voiceItHTML.init_Face_Enrollment();
      });

      $("#videoVerificationBtn").on('click', function() {
        voiceItHTML.init_Video_Verification(liveness);
      });

      $("#videoEnrollmentBtn").on('click', function() {
        voiceItHTML.init_Video_Enrollment();
      });
    };

    var initialized = false;

    $('#mainForm').keydown(function(event) {
      if (event.keyCode == 13) {
        $('#authenticate').click();
      }
    });

    $('.ui.form')
      .form({
        fields: {
          email: {
            identifier: 'email',
            rules: [{
                type: 'empty',
                prompt: 'Please enter your e-mail'
              },
              {
                type: 'email',
                prompt: 'Please enter a valid e-mail'
              }
            ]
          },
          password: {
            identifier: 'password',
            rules: [{
                type: 'empty',
                prompt: 'Please enter your password'
              },
              {
                type: 'length[6]',
                prompt: 'Your password must be at least 6 characters'
              }
            ]
          }
        }
      }, {
        onFailure: function() {
          // prevent form submission (doesn't work)
          return false;
        },
        onSuccess: function(event, fields) {
          event.preventDefault();
          // prevent form submission
          // api / ajax call
          return false;
        }
      });

    function isValidEmailAddress(emailAddress) {
      var pattern = /^([a-z\d!#$%&'*+\-\/=?^_`{|}~\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]+(\.[a-z\d!#$%&'*+\-\/=?^_`{|}~\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]+)*|"((([ \t]*\r\n)?[ \t]+)?([\x01-\x08\x0b\x0c\x0e-\x1f\x7f\x21\x23-\x5b\x5d-\x7e\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]|\\[\x01-\x09\x0b\x0c\x0d-\x7f\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]))*(([ \t]*\r\n)?[ \t]+)?")@(([a-z\d\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]|[a-z\d\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF][a-z\d\-._~\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]*[a-z\d\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])\.)+([a-z\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]|[a-z\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF][a-z\d\-._~\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]*[a-z\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])\.?$/i;
      return pattern.test(emailAddress);
    }

    $('#options').css('display', 'none');
    $('#verify').css('display', 'none');
    $('#enrollVideo').css('opacity', '0.0');
    $('#enrollFace').css('opacity', '0.0');
    $('#enrollVoice').css('opacity', '0.0');

    $('#authenticate').click(function() {
      var em = $('input[name="email"]').val();
      var pass = $('input[name="password"]').val();
      var values = {
        email: em,
        password: pass
      };
      if (pass.length < 6) {
        $('#passwordField').addClass('error');
      } else {
        $('#passwordField').removeClass('error');
      }
      if (!isValidEmailAddress(em)) {
        $('#emailField').addClass('error');
      } else {
        $('#emailField').removeClass('error');
      }
      if (pass.length >= 6 && isValidEmailAddress(em)) {
        var http = new XMLHttpRequest();
        http.open("POST", "/authenticate", true);
        http.setRequestHeader('Content-Type', 'application/json');
        http.send(JSON.stringify(values));
        http.onreadystatechange = function() {
          if (http.readyState === 4) {
            //get response here.
            var response = JSON.parse(http.responseText.trim());
            if (response.responseCode == "SUCC") {
              $('#authenticate').fadeTo(400, 0.0, function() {
                $('#loading').fadeTo(250, 0.6);
                $('#formOverlay').fadeTo(350,0.6);
                if (!initialized) {
                    setTimeout(function(){
                      $('#verifyHolder').css('display', 'flex');
                      $('#verifyHolder').css('justify-content', 'center');
                      $('#verify').text('Please Verify');
                      $('#verify').css('display', 'block');
                      $('#verify').fadeTo(500, 1.0);
                      $('#authenticate').css('display', 'none');
                      $('#options').fadeTo(400, 1.0);
                      $('#loading').fadeTo(250, 0.0, function(){
                        $(this).css('display','none');
                      });
                    },1600);
                  initialized = true;
                }
              });
            } else {
              $('#authenticate').fadeTo(400, 0.0, function() {
                $('#formOverlay').fadeTo(400, 0.4);
                $('#verify').text('Sorry, user not found. Make sure you enter the right credentials');
                setTimeout(function() {
                  $('#formOverlay').fadeTo(400, 1.0);
                  $('#verify').fadeTo(400, 0.0, function() {
                    $('#authenticate').css('display', 'block');
                    $('#authenticate').fadeTo(400, 1.0);
                  });
                }, 2000);
                $('#verify').css('display', 'block');
                $('#verify').fadeTo(500, 1.0);
                $('#authenticate').css('display', 'none');
                $('#options').css('display', 'none');
              });
            }
          }
        }
      }
    });
  });
