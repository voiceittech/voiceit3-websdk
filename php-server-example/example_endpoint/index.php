<?php
session_start();
require('../../voiceit-php-websdk/VoiceIt2WebBackend.php');
include('../config.php');
$myVoiceIt = new VoiceIt2WebBackend($VOICEIT_API_KEY, $VOICEIT_API_TOKEN);
$voiceItResultCallback = function($jsonObj){
  $callType = strtolower($jsonObj["callType"]);
  $userId = $jsonObj["userId"];
  if(stripos($callType, "verification") !== false){
    if($jsonObj["jsonResponse"]["responseCode"] == "SUCC"){
      // User was successfully verified so lookup user details via
      // VoiceIt UserId and begin session
      $_SESSION["userId"] = $userId;
    }
  }
};

$myVoiceIt->InitBackend($_POST, $_FILES, $voiceItResultCallback);
?>
