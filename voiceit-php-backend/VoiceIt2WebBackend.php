<?php

require_once 'dependencies/autoload.php';
use ReallySimpleJWT\Token;
use ReallySimpleJWT\TokenBuilder;
use ReallySimpleJWT\TokenValidator;

function createUUID() {
    return sprintf( '%04x%04x%04x%04x%04x%04x%04x%04x',
        mt_rand( 0, 0xffff ), mt_rand( 0, 0xffff ),
        mt_rand( 0, 0xffff ),
        mt_rand( 0, 0x0fff ) | 0x4000,
        mt_rand( 0, 0x3fff ) | 0x8000,
        mt_rand( 0, 0xffff ), mt_rand( 0, 0xffff ), mt_rand( 0, 0xffff )
    );
}

function saveFileData($fileTempName, $extension){
  $fileName = createUUID()."-file.".$extension;
  move_uploaded_file($fileTempName, $fileName);
  return $fileName;
}

function formatResponse($callType, $userId, $jsonResponse){
  $jsonResponseObj = json_decode($jsonResponse, true);
  return array('callType' => $callType, 'userId' => $userId, 'jsonResponse' => $jsonResponseObj);
}

function returnJson($jsonResponse){
  header('Content-Type: application/json');
  echo $jsonResponse;
}

class VoiceIt2WebBackend {
  public $BASE_URL = 'https://api.voiceit.io';
  public $api_key;
  public $api_token;
  public $platformId = '48';

  function __construct($key, $token) {
     $this->api_key = $key;
     $this->api_token = $token;
  }

  function checkFileExists($file) {
    if(!file_exists($file)){
      throw new \Exception("File {$file} does not exist");
    }
  }

  public function validateToken($userToken){
    $validator = new TokenValidator;
    try {
      $validator->splitToken($userToken)
          ->validateExpiration()
          ->validateSignature("SECRET%_".$this->api_token);
      return true;
    } catch(Exception $e) {
      return false;
    }
  }

  public function getPayload($userToken){
    $result = json_decode(Token::getPayload($userToken),true);
    return $result["userId"];
  }

  public function generateTokenForUser($userId){
    $builder = new TokenBuilder();
    $token = $builder
        ->addPayload(['key' => 'userId', 'value' => $userId])
        ->setSecret("SECRET%_".$this->api_token)
        ->setExpiration(strtotime("+7 day"))
        ->setIssuer("voiceit")
        ->build();
    return $token;
  }

  public function InitBackend($POST_REF, $FILES_REF, $resultCallback){
    $reqType = "".$POST_REF["viRequestType"];
    $secureToken = "".$POST_REF["viSecureToken"];

    if(!$this->validateToken($secureToken)){
      returnJson(json_encode(array('responseCode' => "INVT", 'message' => 'Invalid Token')));
      return;
    }

    $EXTRACTED_USER_ID = $this->getPayload($secureToken);

    if($reqType == "deleteVoiceEnrollments"){
      $resp = $this->deleteAllVoiceEnrollments($EXTRACTED_USER_ID);
      returnJson($resp);
    }

    if($reqType == "deleteFaceEnrollments"){
      $resp = $this->deleteAllFaceEnrollments($EXTRACTED_USER_ID);
      returnJson($resp);
    }

    if($reqType == "deleteVideoEnrollments"){
      $resp = $this->deleteAllVideoEnrollments($EXTRACTED_USER_ID);
      returnJson($resp);
    }

    if($reqType == "enoughVoiceEnrollments"){
      $resp = $this->getAllVoiceEnrollments($EXTRACTED_USER_ID);
      $resp_obj = json_decode($resp);
      $finalResult = "";
      if($resp_obj->responseCode == "SUCC"){
        if($resp_obj->count >= 3){
          $finalResult = json_encode(array('enoughEnrollments' => true));
        } else {
          $finalResult = json_encode(array('enoughEnrollments' => false));
        }
      } else {
        $finalResult = json_encode(array('enoughEnrollments' => false));
      }
      returnJson($finalResult);
    }

    if($reqType == "enoughFaceEnrollments"){
      $resp = $this->getAllFaceEnrollments($EXTRACTED_USER_ID);
      $resp_obj = json_decode($resp);
      if($resp_obj->responseCode == "SUCC"){
        if($resp_obj->count >= 1){
          returnJson(json_encode(array('enoughEnrollments' => true)));
        } else {
          returnJson(json_encode(array('enoughEnrollments' => false)));
        }
      } else {
        returnJson(json_encode(array('enoughEnrollments' => false)));
      }
    }

    if($reqType == "enoughVideoEnrollments"){
      $resp = $this->getAllVideoEnrollments($EXTRACTED_USER_ID);
      $resp_obj = json_decode($resp);
      if($resp_obj->responseCode == "SUCC"){
        if($resp_obj->count >= 3){
          returnJson(json_encode(array('enoughEnrollments' => true)));
        } else {
          returnJson(json_encode(array('enoughEnrollments' => false)));
        }
      } else {
          returnJson(json_encode(array('enoughEnrollments' => false)));
      }
    }

    if($reqType == "createVoiceEnrollment"){
      $contentLang = "".$_POST["viContentLanguage"];
      $phrase = "".$_POST["viPhrase"];
      $recordingFileName = saveFileData($FILES_REF["viVoiceData"]['tmp_name'], "wav");
      $resp = $this->createVoiceEnrollment($EXTRACTED_USER_ID, $contentLang, $phrase, $recordingFileName);
      unlink($recordingFileName) or die("Couldn't delete ".$recordingFileName);
      returnJson($resp);
    }

    if($reqType == "createFaceEnrollment"){
      $videoFileName = saveFileData($FILES_REF["viVideoData"]['tmp_name'], "mp4");
      $resp = $this->createFaceEnrollment($EXTRACTED_USER_ID, $videoFileName);
      unlink($videoFileName) or die("Couldn't delete ".$videoFileName);
      returnJson($resp);
    }

    if($reqType == "createVideoEnrollment"){
      $contentLang = "".$_POST["viContentLanguage"];
      $phrase = "".$_POST["viPhrase"];
      $videoFileName = saveFileData($FILES_REF["viVideoData"]['tmp_name'], "mp4");
      $resp = $this->createVideoEnrollment($EXTRACTED_USER_ID, $contentLang, $phrase, $videoFileName);
      unlink($videoFileName) or die("Couldn't delete ".$videoFileName);
      returnJson($resp);
    }

    if($reqType == "voiceVerification"){
      $contentLang = "".$_POST["viContentLanguage"];
      $phrase = "".$_POST["viPhrase"];
      $recordingFileName = saveFileData($FILES_REF["viVoiceData"]['tmp_name'], "wav");
      $resp = $this->voiceVerification($EXTRACTED_USER_ID, $contentLang, $phrase, $recordingFileName);
      unlink($recordingFileName) or die("Couldn't delete ".$recordingFileName);
      header('Content-Type: application/json');
      $resultCallback(formatResponse($reqType, $EXTRACTED_USER_ID, $resp));
      returnJson($resp);
    }

    if($reqType == "faceVerification"){
      $videoFileName = saveFileData($FILES_REF["viVideoData"]['tmp_name'], "mp4");
      $resp = $this->faceVerification($EXTRACTED_USER_ID, $videoFileName);
      unlink($videoFileName) or die("Couldn't delete ".$videoFileName);
      $resultCallback(formatResponse($reqType, $EXTRACTED_USER_ID, $resp));
      returnJson($resp);
    }

    if($reqType == "faceVerificationWithLiveness"){
      $photoFileName = saveFileData($FILES_REF["viPhotoData"]['tmp_name'], "png");
      $resp = $this->faceVerificationWithPhoto($EXTRACTED_USER_ID, $photoFileName);
      unlink($photoFileName) or die("Couldn't delete ".$photoFileName);
      $resultCallback(formatResponse($reqType, $EXTRACTED_USER_ID, $resp));
      returnJson($resp);
    }

    if($reqType == "videoVerification"){
      $contentLang = "".$_POST["viContentLanguage"];
      $phrase = "".$_POST["viPhrase"];
      $videoFileName = saveFileData($FILES_REF["viVideoData"]['tmp_name'], "mp4");
      $resp = $this->videoVerification($EXTRACTED_USER_ID, $contentLang, $phrase, $videoFileName);
      unlink($videoFileName) or die("Couldn't delete ".$videoFileName);
      $resultCallback(formatResponse($reqType, $EXTRACTED_USER_ID, $resp));
      returnJson($resp);
    }

    if($reqType == "videoVerificationWithLiveness"){
      $contentLang = "".$_POST["viContentLanguage"];
      $phrase = "".$_POST["viPhrase"];
      $audioFileName = saveFileData($FILES_REF["viVoiceData"]['tmp_name'], "wav");
      $photoFileName = saveFileData($FILES_REF["viPhotoData"]['tmp_name'], "png");
      $resp = $this->videoVerificationWithPhoto($EXTRACTED_USER_ID, $contentLang, $phrase, $audioFileName, $photoFileName);
      unlink($audioFileName) or die("Couldn't delete ".$audioFileName);
      unlink($photoFileName) or die("Couldn't delete ".$photoFileName);
      $resultCallback(formatResponse($reqType, $EXTRACTED_USER_ID, $resp));
      returnJson($resp);
    }
  }

  public function createUser() {
    $crl = curl_init();
    curl_setopt($crl, CURLOPT_URL, $this->BASE_URL.'/users');
    curl_setopt($crl, CURLOPT_USERPWD, "$this->api_key:$this->api_token");
    curl_setopt($crl, CURLOPT_HTTPHEADER, array('platformId: '.$this->platformId));
    curl_setopt($crl, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($crl, CURLOPT_CUSTOMREQUEST, 'POST');
    return curl_exec($crl);
  }

  public function checkUserExists($userId) {
    $crl = curl_init();
    curl_setopt($crl, CURLOPT_URL, $this->BASE_URL.'/users/'.$userId);
    curl_setopt($crl, CURLOPT_USERPWD, "$this->api_key:$this->api_token");
    curl_setopt($crl, CURLOPT_HTTPHEADER, array('platformId: '.$this->platformId));
    curl_setopt($crl, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($crl, CURLOPT_CUSTOMREQUEST, 'GET');
    return curl_exec($crl);
  }

  public function deleteUser($userId) {
    $crl = curl_init();
    curl_setopt($crl, CURLOPT_URL, $this->BASE_URL.'/users/'.$userId);
    curl_setopt($crl, CURLOPT_USERPWD, "$this->api_key:$this->api_token");
    curl_setopt($crl, CURLOPT_HTTPHEADER, array('platformId: '.$this->platformId));
    curl_setopt($crl, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($crl, CURLOPT_CUSTOMREQUEST, 'DELETE');
    return curl_exec($crl);
  }

  public function deleteAllEnrollments($userId) {
    $crl = curl_init();
    curl_setopt($crl, CURLOPT_URL, $this->BASE_URL.'/enrollments/'.$userId.'/all');
    curl_setopt($crl, CURLOPT_USERPWD, "$this->api_key:$this->api_token");
    curl_setopt($crl, CURLOPT_HTTPHEADER, array('platformId: '.$this->platformId));
    curl_setopt($crl, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($crl, CURLOPT_CUSTOMREQUEST, 'DELETE');
    return curl_exec($crl);
  }

  public function getAllVoiceEnrollments($userId) {
    $crl = curl_init();
    curl_setopt($crl, CURLOPT_URL, $this->BASE_URL.'/enrollments/voice/'.$userId);
    curl_setopt($crl, CURLOPT_USERPWD, "$this->api_key:$this->api_token");
    curl_setopt($crl, CURLOPT_HTTPHEADER, array('platformId: '.$this->platformId));
    curl_setopt($crl, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($crl, CURLOPT_CUSTOMREQUEST, 'GET');
    return curl_exec($crl);
  }

  public function getAllFaceEnrollments($userId) {
    $crl = curl_init();
    curl_setopt($crl, CURLOPT_URL, $this->BASE_URL.'/enrollments/face/'.$userId);
    curl_setopt($crl, CURLOPT_USERPWD, "$this->api_key:$this->api_token");
    curl_setopt($crl, CURLOPT_HTTPHEADER, array('platformId: '.$this->platformId));
    curl_setopt($crl, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($crl, CURLOPT_CUSTOMREQUEST, 'GET');
    return curl_exec($crl);
  }

  public function getAllVideoEnrollments($userId) {
    $crl = curl_init();
    curl_setopt($crl, CURLOPT_URL, $this->BASE_URL.'/enrollments/video/'.$userId);
    curl_setopt($crl, CURLOPT_USERPWD, "$this->api_key:$this->api_token");
    curl_setopt($crl, CURLOPT_HTTPHEADER, array('platformId: '.$this->platformId));
    curl_setopt($crl, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($crl, CURLOPT_CUSTOMREQUEST, 'GET');
    return curl_exec($crl);
  }

	public function createVoiceEnrollment($userId, $contentLanguage, $phrase, $filePath) {
    $this->checkFileExists($filePath);
    $crl = curl_init();
    curl_setopt($crl, CURLOPT_URL, $this->BASE_URL.'/enrollments/voice');
    curl_setopt($crl, CURLOPT_USERPWD, "$this->api_key:$this->api_token");
    curl_setopt($crl, CURLOPT_HTTPHEADER, array('platformId: '.$this->platformId));
    curl_setopt($crl, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($crl, CURLOPT_CUSTOMREQUEST, 'POST');
    $fields = [
      'userId' => $userId,
      'contentLanguage' => $contentLanguage,
      'phrase' => $phrase,
      'recording' => curl_file_create($filePath)
    ];
    curl_setopt($crl, CURLOPT_POSTFIELDS, $fields);
    return curl_exec($crl);
	}

  public function createFaceEnrollment($userId, $filePath, $doBlinkDetection = false) {
    $this->checkFileExists($filePath);
    $crl = curl_init();
    curl_setopt($crl, CURLOPT_URL, $this->BASE_URL.'/enrollments/face');
    curl_setopt($crl, CURLOPT_USERPWD, "$this->api_key:$this->api_token");
    curl_setopt($crl, CURLOPT_HTTPHEADER, array('platformId: '.$this->platformId));
    curl_setopt($crl, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($crl, CURLOPT_CUSTOMREQUEST, 'POST');
    $fields = [
      'userId' => $userId,
      'doBlinkDetection' => $doBlinkDetection ? 1 : 0,
      'video' => curl_file_create($filePath)
    ];
    curl_setopt($crl, CURLOPT_POSTFIELDS, $fields);
    return curl_exec($crl);
	}

  public function createVideoEnrollment($userId, $contentLanguage, $phrase, $filePath, $doBlinkDetection = false) {
    $this->checkFileExists($filePath);
    $crl = curl_init();
    curl_setopt($crl, CURLOPT_URL, $this->BASE_URL.'/enrollments/video');
    curl_setopt($crl, CURLOPT_USERPWD, "$this->api_key:$this->api_token");
    curl_setopt($crl, CURLOPT_HTTPHEADER, array('platformId: '.$this->platformId));
    curl_setopt($crl, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($crl, CURLOPT_CUSTOMREQUEST, 'POST');
    $fields = [
      'userId' => $userId,
      'contentLanguage' => $contentLanguage,
      'phrase' => $phrase,
      'doBlinkDetection' => $doBlinkDetection ? 1 : 0,
      'video' => curl_file_create($filePath)
    ];
    curl_setopt($crl, CURLOPT_POSTFIELDS, $fields);
    return curl_exec($crl);
	}

  public function deleteAllVoiceEnrollments($userId) {
    $crl = curl_init();
    curl_setopt($crl, CURLOPT_URL, $this->BASE_URL.'/enrollments/'.$userId.'/voice');
    curl_setopt($crl, CURLOPT_USERPWD, "$this->api_key:$this->api_token");
    curl_setopt($crl, CURLOPT_HTTPHEADER, array('platformId: '.$this->platformId));
    curl_setopt($crl, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($crl, CURLOPT_CUSTOMREQUEST, 'DELETE');
    return curl_exec($crl);
  }

  public function deleteAllFaceEnrollments($userId) {
    $crl = curl_init();
    curl_setopt($crl, CURLOPT_URL, $this->BASE_URL.'/enrollments/'.$userId.'/face');
    curl_setopt($crl, CURLOPT_USERPWD, "$this->api_key:$this->api_token");
    curl_setopt($crl, CURLOPT_HTTPHEADER, array('platformId: '.$this->platformId));
    curl_setopt($crl, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($crl, CURLOPT_CUSTOMREQUEST, 'DELETE');
    return curl_exec($crl);
  }

  public function deleteAllVideoEnrollments($userId) {
    $crl = curl_init();
    curl_setopt($crl, CURLOPT_URL, $this->BASE_URL.'/enrollments/'.$userId.'/video');
    curl_setopt($crl, CURLOPT_USERPWD, "$this->api_key:$this->api_token");
    curl_setopt($crl, CURLOPT_HTTPHEADER, array('platformId: '.$this->platformId));
    curl_setopt($crl, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($crl, CURLOPT_CUSTOMREQUEST, 'DELETE');
    return curl_exec($crl);
  }

  public function deleteVoiceEnrollment($userId, $enrollmentId) {
    $crl = curl_init();
    curl_setopt($crl, CURLOPT_URL, $this->BASE_URL.'/enrollments/voice/'.$userId.'/'.strval($enrollmentId));
    curl_setopt($crl, CURLOPT_USERPWD, "$this->api_key:$this->api_token");
    curl_setopt($crl, CURLOPT_HTTPHEADER, array('platformId: '.$this->platformId));
    curl_setopt($crl, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($crl, CURLOPT_CUSTOMREQUEST, 'DELETE');
    return curl_exec($crl);
  }

  public function deleteFaceEnrollment($userId, $faceEnrollmentId) {
    $crl = curl_init();
    curl_setopt($crl, CURLOPT_URL, $this->BASE_URL.'/enrollments/face/'.$userId.'/'.strval($faceEnrollmentId));
    curl_setopt($crl, CURLOPT_USERPWD, "$this->api_key:$this->api_token");
    curl_setopt($crl, CURLOPT_HTTPHEADER, array('platformId: '.$this->platformId));
    curl_setopt($crl, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($crl, CURLOPT_CUSTOMREQUEST, 'DELETE');
    return curl_exec($crl);
  }

  public function deleteVideoEnrollment($userId, $enrollmentId) {
    $crl = curl_init();
    curl_setopt($crl, CURLOPT_URL, $this->BASE_URL.'/enrollments/video/'.$userId.'/'.strval($enrollmentId));
    curl_setopt($crl, CURLOPT_USERPWD, "$this->api_key:$this->api_token");
    curl_setopt($crl, CURLOPT_HTTPHEADER, array('platformId: '.$this->platformId));
    curl_setopt($crl, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($crl, CURLOPT_CUSTOMREQUEST, 'DELETE');
    return curl_exec($crl);
  }

  public function voiceVerification($userId, $contentLanguage, $phrase, $filePath) {
    $this->checkFileExists($filePath);
    $crl = curl_init();
    curl_setopt($crl, CURLOPT_URL, $this->BASE_URL.'/verification/voice');
    curl_setopt($crl, CURLOPT_USERPWD, "$this->api_key:$this->api_token");
    curl_setopt($crl, CURLOPT_HTTPHEADER, array('platformId: '.$this->platformId));
    curl_setopt($crl, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($crl, CURLOPT_CUSTOMREQUEST, 'POST');
    $fields = [
      'userId' => $userId,
      'contentLanguage' => $contentLanguage,
      'phrase' => $phrase,
      'recording' => curl_file_create($filePath)
    ];
    curl_setopt($crl, CURLOPT_POSTFIELDS, $fields);
    return curl_exec($crl);
  }

  public function faceVerification($userId, $filePath, $doBlinkDetection = false) {
    $this->checkFileExists($filePath);
    $crl = curl_init();
    curl_setopt($crl, CURLOPT_URL, $this->BASE_URL.'/verification/face');
    curl_setopt($crl, CURLOPT_USERPWD, "$this->api_key:$this->api_token");
    curl_setopt($crl, CURLOPT_HTTPHEADER, array('platformId: '.$this->platformId));
    curl_setopt($crl, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($crl, CURLOPT_CUSTOMREQUEST, 'POST');
    $fields = [
      'userId' => $userId,
      'doBlinkDetection' => $doBlinkDetection ? 1 : 0,
      'video' => curl_file_create($filePath)
    ];
    curl_setopt($crl, CURLOPT_POSTFIELDS, $fields);
    return curl_exec($crl);
  }

  public function faceVerificationWithPhoto($userId, $filePath) {
    $this->checkFileExists($filePath);
    $crl = curl_init();
    curl_setopt($crl, CURLOPT_URL, $this->BASE_URL.'/verification/face');
    curl_setopt($crl, CURLOPT_USERPWD, "$this->api_key:$this->api_token");
    curl_setopt($crl, CURLOPT_HTTPHEADER, array('platformId: '.$this->platformId));
    curl_setopt($crl, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($crl, CURLOPT_CUSTOMREQUEST, 'POST');
    $fields = [
      'userId' => $userId,
      'photo' => curl_file_create($filePath)
    ];
    curl_setopt($crl, CURLOPT_POSTFIELDS, $fields);
    return curl_exec($crl);
  }

  public function videoVerification($userId, $contentLanguage, $phrase, $filePath, $doBlinkDetection = false) {
    $this->checkFileExists($filePath);
    $crl = curl_init();
    curl_setopt($crl, CURLOPT_URL, $this->BASE_URL.'/verification/video');
    curl_setopt($crl, CURLOPT_USERPWD, "$this->api_key:$this->api_token");
    curl_setopt($crl, CURLOPT_HTTPHEADER, array('platformId: '.$this->platformId));
    curl_setopt($crl, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($crl, CURLOPT_CUSTOMREQUEST, 'POST');
    $fields = [
      'userId' => $userId,
      'contentLanguage' => $contentLanguage,
      'phrase' => $phrase,
      'doBlinkDetection' => $doBlinkDetection ? 1 : 0,
      'video' => curl_file_create($filePath)
    ];
    curl_setopt($crl, CURLOPT_POSTFIELDS, $fields);
    return curl_exec($crl);
  }

  public function videoVerificationWithPhoto($userId, $contentLanguage, $phrase, $audioFilePath, $photoFilePath) {
    $this->checkFileExists($audioFilePath);
    $this->checkFileExists($photoFilePath);
    $crl = curl_init();
    curl_setopt($crl, CURLOPT_URL, $this->BASE_URL.'/verification/video');
    curl_setopt($crl, CURLOPT_USERPWD, "$this->api_key:$this->api_token");
    curl_setopt($crl, CURLOPT_HTTPHEADER, array('platformId: '.$this->platformId));
    curl_setopt($crl, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($crl, CURLOPT_CUSTOMREQUEST, 'POST');
    $fields = [
      'userId' => $userId,
      'contentLanguage' => $contentLanguage,
      'phrase' => $phrase,
      'audio' => curl_file_create($audioFilePath),
      'photo' => curl_file_create($photoFilePath)
    ];
    curl_setopt($crl, CURLOPT_POSTFIELDS, $fields);
    return curl_exec($crl);
  }

}
?>
