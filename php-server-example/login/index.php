<?php
require('../../voiceit-php-websdk/VoiceIt2WebBackend.php');
include('../config.php');


$email = "".$_GET["email"];
$password = "".$_GET["password"];

if($email == $DEMO_EMAIL && $password == $DEMO_PASSWORD){
  header("HTTP/1.1 200 OK");
  $myVoiceIt = new VoiceIt2WebBackend($VOICEIT_API_KEY, $VOICEIT_API_TOKEN);
  $createdToken = $myVoiceIt->generateTokenForUser($VOICEIT_TEST_USERID);
  $jsonResponse = Array(
    "ResponseCode" => "SUCC",
    "Message" => "Successfully authenticated user",
    "Token" => $createdToken
  );
  echo json_encode($jsonResponse);
}
else if($password != $DEMO_PASSWORD){
  header("HTTP/1.1 401 UNAUTHORIZED");
  $jsonResponse = Array(
    "ResponseCode" => "INPW",
    "Message" => "Incorrect Password"
  );
  echo json_encode($jsonResponse);
}
else {
  header("HTTP/1.1 401 UNAUTHORIZED");
  $jsonResponse = Array(
    "ResponseCode" => "UNFD",
    "Message" => "User not found"
  );
  echo json_encode($jsonResponse);
}
?>
