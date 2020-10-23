import Colors from "./colors";
import vi$ from "./utilities";

export default function Liveness(VoiceItObj) {
  const modal = VoiceItObj.modal;
  const LivenessRef = this;
  LivenessRef.oldCircles = [];

  LivenessRef.playAudioPrompt = function(promptPath){
    switch (promptPath) {
      case "LIVENESS_SUCCESS.wav":
      if (VoiceItObj.livenessAudio) {
          document.getElementById("audioSrc").src = "wav/" + VoiceItObj.contentLanguage + "/" + promptPath;
          document.getElementById("audioPrompt").load();
      }
        break;
      case "LIVENESS_TRY_AGAIN.wav":
      if (VoiceItObj.livenessAudio) {
          document.getElementById("audioSrc").src = "wav/" + VoiceItObj.contentLanguage + "/" + promptPath;
          document.getElementById("audioPrompt").load();
      }
        break;
      case "LIVENESS_FAILED.wav":
      if (VoiceItObj.livenessAudio) {
          document.getElementById("audioSrc").src = "wav/" + VoiceItObj.contentLanguage + "/" + promptPath;
          document.getElementById("audioPrompt").load();
      }
        break;
      default:
    }
  }

  LivenessRef.drawCircle = function(testType) {
    modal.createAudioPrompts();
    switch (testType) {
      case "FACE_UP":
      if (VoiceItObj.livenessAudio) {
          document.getElementById("audioSrc").src = "wav/" + VoiceItObj.contentLanguage + "/FACE_UP.wav";
          document.getElementById("audioPrompt").load();
      }
      modal.updateProgressCircle(
        modal.domRef.progressCircle,
        0.25,
        "#FBC132"
      );
      vi$.qs(modal.domRef.progressCircle).style.transform = "rotate(315deg)";
      LivenessRef.oldCircles[0] = 0.25;
      LivenessRef.oldCircles[1] = "rotate(315deg)";
        break;
      case "FACE_DOWN":
      if (VoiceItObj.livenessAudio) {
          document.getElementById("audioSrc").src = "wav/" + VoiceItObj.contentLanguage + "/FACE_DOWN.wav";
          document.getElementById("audioPrompt").load();
      }
        modal.updateProgressCircle(
          modal.domRef.progressCircle,
          0.25,
          "#FBC132"
        );
        vi$.qs(modal.domRef.progressCircle).style.transform = "rotate(135deg)";
        LivenessRef.oldCircles[0] = 0.25;
        LivenessRef.oldCircles[1] = "rotate(135deg)";
        break;
      case "FACE_TILT_RIGHT":
      if (VoiceItObj.livenessAudio) {
          document.getElementById("audioSrc").src = "wav/" + VoiceItObj.contentLanguage + "/FACE_TILT_RIGHT.wav";
          document.getElementById("audioPrompt").load();
      }
      modal.updateProgressCircle(
        modal.domRef.progressCircle,
        0.25,
        "#FBC132"
      );
      vi$.qs(modal.domRef.progressCircle).style.transform = "rotate(22.5deg)";
      LivenessRef.oldCircles[0] = 0.25;
      LivenessRef.oldCircles[1] = "rotate(22.5deg)";
      break;
      case "FACE_RIGHT":
      if (VoiceItObj.livenessAudio) {
          document.getElementById("audioSrc").src = "wav/" + VoiceItObj.contentLanguage + "/FACE_RIGHT.wav";
          document.getElementById("audioPrompt").load();
      }
        modal.updateProgressCircle(
          modal.domRef.progressCircle,
          0.25,
          "#FBC132"
        );
        vi$.qs(modal.domRef.progressCircle).style.transform = "rotate(45deg)";
        LivenessRef.oldCircles[0] = 0.25;
        LivenessRef.oldCircles[1] = "rotate(45deg)";
        break;
      case "FACE_TILT_LEFT":
      if (VoiceItObj.livenessAudio) {
          document.getElementById("audioSrc").src = "wav/" + VoiceItObj.contentLanguage + "/FACE_TILT_LEFT.wav";
          document.getElementById("audioPrompt").load();
      }
      modal.updateProgressCircle(
        modal.domRef.progressCircle,
        0.25,
        "#FBC132"
      );
      vi$.qs(modal.domRef.progressCircle).style.transform = "rotate(247.5deg)";
      LivenessRef.oldCircles[0] = 0.25;
      LivenessRef.oldCircles[1] = "rotate(247.5deg)";
      break;
      case "FACE_LEFT":
      if (VoiceItObj.livenessAudio) {
          document.getElementById("audioSrc").src = "wav/" + VoiceItObj.contentLanguage + "/FACE_LEFT.wav";
          document.getElementById("audioPrompt").load();
      }
        modal.updateProgressCircle(
          modal.domRef.progressCircle,
          0.25,
          "#FBC132"
        );
        vi$.qs(modal.domRef.progressCircle).style.transform = "rotate(220deg)";
        LivenessRef.oldCircles[0] = 0.25;
        LivenessRef.oldCircles[1] = "rotate(220deg)";
        break;
      case "SMILE":
      if (VoiceItObj.livenessAudio) {
          document.getElementById("audioSrc").src = "wav/" + VoiceItObj.contentLanguage + "/SMILE.wav";
          document.getElementById("audioPrompt").load();
      }
        modal.updateProgressCircle(modal.domRef.progressCircle, 1.0, "#FBC132");
        vi$.qs(modal.domRef.progressCircle).style.transform = "rotate(0deg)";
        LivenessRef.oldCircles[0] = 1.0;
        LivenessRef.oldCircles[1] = "rotate(0deg)";
        break;
      default:
    }
  };

  LivenessRef.redrawCircle = function(testType) {
    switch (testType) {
      case 0:
        modal.updateProgressCircle(
          modal.domRef.progressCircle,
          LivenessRef.oldCircles[0],
          Colors.MAIN_THEME_COLOR
        );
        vi$.qs(modal.domRef.progressCircle).style.transform =
          LivenessRef.oldCircles[1];
        setTimeout(function() {
          modal.hideProgressCircle(300, function() {
            modal.updateProgressCircle(
              modal.domRef.progressCircle,
              0.25,
              "#FBC132"
            );
            vi$.qs(modal.domRef.progressCircle).style.transform =
              "rotate(135deg)";
            LivenessRef.oldCircles[0] = 0.25;
            LivenessRef.oldCircles[1] = "rotate(135deg)";
            modal.revealProgressCircle(300);
          });
        }, 2000);
        break;
      case 1:
        modal.updateProgressCircle(
          modal.domRef.progressCircle,
          LivenessRef.oldCircles[0],
          Colors.MAIN_THEME_COLOR
        );
        vi$.qs(modal.domRef.progressCircle).style.transform =
          LivenessRef.oldCircles[1];
        setTimeout(function() {
          modal.hideProgressCircle(300, function() {
            modal.updateProgressCircle(
              modal.domRef.progressCircle,
              0.25,
              "#FBC132"
            );
            vi$.qs(modal.domRef.progressCircle).style.transform =
              "rotate(45deg)";
            LivenessRef.oldCircles[0] = 0.25;
            LivenessRef.oldCircles[1] = "rotate(45deg)";
            modal.revealProgressCircle(300);
          });
        }, 2000);
        break;
      case 2:
        modal.updateProgressCircle(
          modal.domRef.progressCircle,
          LivenessRef.oldCircles[0],
          Colors.MAIN_THEME_COLOR
        );
        vi$.qs(modal.domRef.progressCircle).style.transform =
          LivenessRef.oldCircles[1];
        setTimeout(function() {
          modal.hideProgressCircle(300, function() {
            modal.updateProgressCircle(
              modal.domRef.progressCircle,
              0.25,
              "#FBC132"
            );
            vi$.qs(modal.domRef.progressCircle).style.transform =
              "rotate(220deg)";
            LivenessRef.oldCircles[0] = 0.25;
            LivenessRef.oldCircles[1] = "rotate(220deg)";
            modal.revealProgressCircle(300);
          });
        }, 2000);
        break;
      case 3:
        modal.updateProgressCircle(
          modal.domRef.progressCircle,
          LivenessRef.oldCircles[0],
          Colors.MAIN_THEME_COLOR
        );
        vi$.qs(modal.domRef.progressCircle).style.transform =
          LivenessRef.oldCircles[1];
        setTimeout(function() {
          modal.displayMessage(LivenessRef.prompts.getPrompt("SMILE"));
          modal.hideProgressCircle(300, function() {
            modal.updateProgressCircle(
              modal.domRef.progressCircle,
              1.0,
              "#FBC132"
            );
            LivenessRef.oldCircles[0] = 1.0;
            LivenessRef.oldCircles[1] = "rotate(0deg)";
            modal.revealProgressCircle(300);
          });
        }, 300);
        break;
      case 4:
        modal.updateProgressCircle(
          modal.domRef.progressCircle,
          LivenessRef.oldCircles[0],
          Colors.MAIN_THEME_COLOR
        );
        vi$.qs(modal.domRef.progressCircle).style.transform =
          LivenessRef.oldCircles[1];
        setTimeout(function() {
          modal.displayMessage(LivenessRef.prompts.getPrompt("YAWN"));
          modal.hideProgressCircle(300, function() {
            modal.updateProgressCircle(
              modal.domRef.progressCircle,
              1.0,
              "#FBC132"
            );
            LivenessRef.oldCircles[0] = 1.0;
            LivenessRef.oldCircles[1] = "rotate(0deg)";
            modal.revealProgressCircle(300);
          });
        }, 300);
        break;
      default:
    }
  };
}
