

this.doEnrollment = function (recording, type) {
  type = type[0]+type[1];
  var response;
  switch (type){
    case "voiceEnrollment":
      var obj = this;
      this.voiceEnrollment("usr_7daff904145847daa0dcf3229424ffa9", "en-US", recording, function(jsonResponse) {
      response = JSON.parse(jsonResponse);
      return obj.handleResponse(response,type);
      });
      break;
    case "voiceVerification":
      var obj = this;
      this.voiceVerification("usr_7daff904145847daa0dcf3229424ffa9", "en-US", recording, function(jsonResponse) {
      response = JSON.parse(jsonResponse);
      return obj.handleResponse(response,type);
      });
      break;
    case "faceVerification":
      var obj = this;
      this.faceVerification("usr_7daff904145847daa0dcf3229424ffa9",recording, function(jsonResponse) {
      response = JSON.parse(jsonResponse);
      return obj.handleResponse(response,type);
      });
      break;
    case "faceEnrollment":
      var obj = this;
      this.faceEnrollment("usr_7daff904145847daa0dcf3229424ffa9",recording, function(jsonResponse) {
      response = JSON.parse(jsonResponse);
      return obj.handleResponse(response,type);
      });
      break;
    case "videoVerification":
      var obj = this;
      this.videoVerification("usr_7daff904145847daa0dcf3229424ffa9", "en-US",recording, function(jsonResponse) {
      response = JSON.parse(jsonResponse);
      return obj.handleResponse(response,type);
      });
      break;
    case "videoEnrollment":
      var obj = this;
      this.videoEnrollment("usr_7daff904145847daa0dcf3229424ffa9", "en-US", recording, function(jsonResponse) {
      response = JSON.parse(jsonResponse);
      return obj.handleResponse(response,type);
      });
      break;
    }
};

this.handleResponse = function(response,type) {
  console.log(response);
  var prompt = new prompts();
  setTimeout(function () {
  $('#wait').fadeTo(300,0.0, function() {
    $(this).css('display', 'none');
    $('#header').css('display', 'inline-block');
    $('#header').fadeTo(300, 1.0);
    });
    if (response.responseCode == "SUCC"){
        $('#header').text(prompt.getPrompt("SUCC_E"));
        return true;
      } else {
        $('#header').text(prompt.getPrompt(response.responseCode));
        return false;
      }
    }, 700);
  };
//
//
// this.videoEnrollment = function (userId, contentLanguage, recording, callback) {
//   var formData = new FormData();
//   formData.append('userId', userId);
//   formData.append('contentLanguage', contentLanguage);
//   formData.append('doBlinkDetection', false);
//   formData.append('video', recording.video);
//   var http = new XMLHttpRequest();
//   http.open("POST", "https://api.voiceit.io/enrollments/video");
//
//   http.setRequestHeader("Authorization", "Basic " + btoa(this.key + ":" + this.token));
//   http.onreadystatechange = function() {
//     if(http.readyState === 4) {
//       callback(http.responseText.trim());
//     }
//   }
//   http.send(formData);
// };
//
// this.voiceEnrollment = function (userId, contentLanguage, recording, callback) {
//   var formData = new FormData();
//   formData.append('userId', userId);
//   formData.append('contentLanguage', contentLanguage);
//   formData.append('recording', recording);
//   var http = new XMLHttpRequest();
//   http.open("POST", "https://api.voiceit.io/enrollments");
//   http.setRequestHeader("Authorization", "Basic " + btoa(this.key + ":" + this.token));
//   http.onreadystatechange = function() {
//     if(http.readyState === 4) {
//       callback(http.responseText.trim());
//     }
//   }
//   http.send(formData);
// };
//
// this.faceEnrollment = function (userId, recording, callback) {
//   var formData = new FormData();
//   formData.append('userId', userId);
//   formData.append('doBlinkDetection', false);
//   formData.append('video', recording);
//   var http = new XMLHttpRequest();
//   http.open("POST", "https://api.voiceit.io/enrollments/face");
//
//   http.setRequestHeader("Authorization", "Basic " + btoa(this.key + ":" + this.token));
//   http.onreadystatechange = function() {
//     if(http.readyState === 4) {
//       callback(http.responseText.trim());
//     }
//   }
//   http.send(formData);
// };
//
// this.voiceVerification = function (userId, contentLanguage, recording, callback) {
//   var formData = new FormData();
//   formData.append('userId', userId);
//     formData.append('contentLanguage', contentLanguage);
//   formData.append('recording', recording);
//   var http = new XMLHttpRequest();
//   http.open("POST", "https://api.voiceit.io/verification");
//   http.setRequestHeader("Authorization", "Basic " + btoa(this.key + ":" + this.token));
//   http.onreadystatechange = function() {
//     if(http.readyState === 4) {
//       callback(http.responseText.trim());
//     }
//   }
//   http.send(formData);
// };
//
// this.faceVerification = function (userId, recording, callback) {
//   var formData = new FormData();
//   formData.append('userId', userId);
//   formData.append('doBlinkDetection', false);
//   formData.append('video', recording);
//   var http = new XMLHttpRequest();
//   http.open("POST", "https://api.voiceit.io/verification/face");
//
//   http.setRequestHeader("Authorization", "Basic " + btoa(this.key + ":" + this.token));
//   http.onreadystatechange = function() {
//     if(http.readyState === 4) {
//       callback(http.responseText.trim());
//     }
//   }
//   http.send(formData);
// };
//
// this.videoVerification = function (userId, contentLanguage, recording, callback) {
//   var formData = new FormData();
//   formData.append('userId', userId);
//   formData.append('contentLanguage', contentLanguage);
//   formData.append('doBlinkDetection', false);
//   formData.append('video', recording.video);
//   var http = new XMLHttpRequest();
//   http.open("POST", "https://api.voiceit.io/verification/video");
//
//   http.setRequestHeader("Authorization", "Basic " + btoa(this.key + ":" + this.token));
//   http.onreadystatechange = function() {
//     if(http.readyState === 4) {
//       callback(http.responseText.trim());
//     }
//   }
//   http.send(formData);
// };
//
// this.deleteAllEnrollmentsForUser = function (userId, callback) {
//   var http = new XMLHttpRequest();
//   http.open("DELETE", "https://api.voiceit.io/enrollments/" + userId + "/all");
//
//   http.setRequestHeader("Authorization", "Basic " + btoa(this.key + ":" + this.token));
//   http.onreadystatechange = function() {
//     if(http.readyState === 4) {
//       callback(http.responseText.trim());
//     }
//   }
//   http.send();
// };
