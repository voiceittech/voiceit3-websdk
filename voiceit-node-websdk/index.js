const jwt = require('jsonwebtoken');
const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const uuidv4 = require('uuid/v4');
const pckg = require('./package.json');

const API2_BASE_URL = 'https://api.voiceit.io';
const LIVENESS_SERVER_BASE_URL = 'https://liveness.voiceit.io'

function checkFileExists(filePath, callback) {
  if (!fs.existsSync(filePath)) {
    callback(Error(`File Path ${filePath} Does Not Exist`));
    return false;
  }
  return true;
}

function writeFileBuffer(path, buffer, extension, done){
  var filePath = `${path}${uuidv4()}.${extension}`;
  var wstream = fs.createWriteStream(filePath);
  wstream.write(buffer);
  wstream.on('finish', done);
  wstream.end();
  return filePath;
}

function formatResponse(callType, userId, jsonResponse){
  var jsonResponseObj = {
    'callType': callType,
    'userId': userId,
    'jsonResponse':jsonResponse
  };
  return jsonResponseObj;
}

function VoiceIt2(apk, tok, options) {
  // Set default options
  if (!options) options = {};
  this.options = {
    tempFilePath: options.tempFilePath || ""
  };

  this.axiosInstance = axios.create({
    auth: {
      username: apk,
      password: tok,
    },
    headers: {
      platformId: '44',
      platformVersion: pckg.version,
    },
  });


  this.notificationUrl = '';

  this.addNotificationUrl = (options, callback) => {
    this.notificationUrl = `?notificationURL=${querystring.escape(options.url)}`;
    callback();
  };

  this.removeNotificationUrl = (callback) => {
    this.notificationUrl = '';
    callback();
  };

  this.validateToken = (userToken, callback) => {
    jwt.verify(userToken,`SECRET%_${tok}`, function(err, decodedPayload) {
    if (err) {
      callback(false);
    } else {
      callback(true, JSON.parse(decodedPayload.data));
    }
  });
  };

  this.generateTokenForUser = (userId) => {
    const token = jwt.sign({
      data: JSON.stringify({ 'userId' : userId })
    }, `SECRET%_${tok}`, { expiresIn: '168h' });
    return token;
  }

  this.initBackend = (req, res, resultCallback) => {
    const reqType = req.body.viRequestType;
    const secureToken = req.body.viSecureToken;
    const mainThis = this;
    this.validateToken(secureToken, (isValid, payloadObj) => {
      if(!isValid){
        res.json({
          'responseCode' : 'INVT',
          'message' : 'Invalid Token'
        });
        return;
      }

      const extractedUserId = payloadObj.userId;
      switch(reqType) {
          case "deleteAllEnrollments":
              mainThis.deleteAllEnrollments({userId: extractedUserId}, (result) =>{
                res.json(result);
              });
              break;
          case "enoughVoiceEnrollments":
              mainThis.getAllVoiceEnrollments({userId: extractedUserId}, (resultVoice) =>{
                mainThis.getAllVideoEnrollments({userId: extractedUserId}, (resultVideo) =>{
                if(resultVoice.responseCode === 'SUCC' && resultVideo.responseCode === 'SUCC'){
                  if((resultVoice.count + resultVideo.count) >= 3){
                    res.json({ enoughEnrollments : true});
                  } else {
                    res.json({ enoughEnrollments : false });
                  }
                } else {
                  res.json({ enoughEnrollments : false });
                }
                });
              });
              break;
          case "enoughFaceEnrollments":
              mainThis.getAllFaceEnrollments({userId: extractedUserId}, (resultFace) =>{
                mainThis.getAllVideoEnrollments({userId: extractedUserId}, (resultVideo) =>{
                if(resultFace.responseCode === 'SUCC' && resultVideo.responseCode === 'SUCC'){
                  if((resultFace.count + resultVideo.count) >= 1){
                    res.json({ enoughEnrollments : true});
                  } else {
                    res.json({ enoughEnrollments : false });
                  }
                } else {
                  res.json({ enoughEnrollments : false });
                }
                });
              });
              break;
          case "enoughVideoEnrollments":
              mainThis.getAllVideoEnrollments({userId: extractedUserId}, (result) =>{
                if(result.responseCode === 'SUCC'){
                  if(result.count >= 3){
                    res.json({ enoughEnrollments : true});
                  } else {
                    res.json({ enoughEnrollments : false });
                  }
                } else {
                  res.json({ enoughEnrollments : false });
                }
              });
              break;
          case "createVoiceEnrollment":
              var phrase = req.body.viPhrase;
              var contentLang = req.body.viContentLanguage;
              var tempFilePath = writeFileBuffer(mainThis.options.tempFilePath, req.files[0].buffer, 'wav', function(){
                mainThis.createVoiceEnrollment({
                  userId: extractedUserId,
                  contentLanguage: contentLang,
                  phrase: phrase,
                  audioFilePath: tempFilePath
                }, (result) => {
                  fs.unlinkSync(tempFilePath);
                  res.json(result);
                });
              });
              break;
          case "createFaceEnrollment":
              var tempFilePath = writeFileBuffer(mainThis.options.tempFilePath, req.files[0].buffer, 'jpg', function(){
                mainThis.createFaceEnrollment({
                  userId: extractedUserId,
                  videoFilePath: tempFilePath
                }, (result) => {
                  fs.unlinkSync(tempFilePath);
                  res.json(result);
                });
              });
              break;
          case "createVideoEnrollment":
              var phrase = req.body.viPhrase;
              var contentLang = req.body.viContentLanguage;
              var tempFilePath = writeFileBuffer(mainThis.options.tempFilePath, req.files[0].buffer, '.mp4', function(){
                mainThis.createVideoEnrollment({
                  userId: extractedUserId,
                  contentLanguage: contentLang,
                  phrase: phrase,
                  videoFilePath: tempFilePath
                },(result) => {
                  fs.unlinkSync(tempFilePath);
                  res.json(result);
                });
              });
              break;
          case "voiceVerification":
              var phrase = req.body.viPhrase;
              var contentLang = req.body.viContentLanguage;
              var tempFilePath = writeFileBuffer(mainThis.options.tempFilePath, req.files[0].buffer,'.wav', function(){
                mainThis.voiceVerification({
                  userId: extractedUserId,
                  contentLanguage: contentLang,
                  phrase: phrase,
                  audioFilePath: tempFilePath
                }, (result) => {
                  fs.unlinkSync(tempFilePath);
                  resultCallback(formatResponse(reqType, extractedUserId, result));
                  res.json(result);
                });
              });
              break;
          case "faceVerification":
              var tempFilePath = writeFileBuffer(mainThis.options.tempFilePath, req.files[0].buffer, 'mp4', function(){
                mainThis.faceVerification({
                  userId: extractedUserId,
                  videoFilePath: tempFilePath
                }, (result) => {
                  fs.unlinkSync(tempFilePath);
                  resultCallback(formatResponse(reqType, extractedUserId, result));
                  res.json(result);
                });
              });
              break;
          case "faceVerificationWithLiveness":
              var tempFilePath = writeFileBuffer(mainThis.options.tempFilePath, req.files[0].buffer, 'mp4', function(){
                mainThis.faceVerificationWithPhoto({
                    userId: extractedUserId,
                    photoFilePath: tempFilePath
                  }, (result) => {
                    fs.unlinkSync(tempFilePath);
                    resultCallback(formatResponse(reqType, extractedUserId, result));
                    res.json(result);
                });
              });
              break;
          case "initialLiveness":
          var contentLang = req.body.viContentLanguage;
              mainThis.getLCO({
                userId: extractedUserId,
                contentLanguage: contentLang
              }, (result,status) =>{
                  resultCallback(formatResponse(reqType, extractedUserId, result));
                  result.status = status;
                  res.json(result);
              });
              break;
          case "faceLiveness":
          var tempFilePath = writeFileBuffer(mainThis.options.tempFilePath, req.files[0].buffer, 'mp4', function(){
            mainThis.faceLiveness({
              userId: extractedUserId,
              file: tempFilePath,
              lcoId: req.body.vilcoId
            }, (result) => {
              fs.unlinkSync(tempFilePath);
              resultCallback(formatResponse(reqType, extractedUserId, result));
              res.json(result);
            });
          });
            break;
          case "videoLiveness":
          var phrase = req.body.viPhrase;
          var tempFilePath = writeFileBuffer(mainThis.options.tempFilePath, req.files[0].buffer, 'mp4', function(){
            mainThis.videoLiveness({
              userId: extractedUserId,
              file: tempFilePath,
              lcoId: req.body.vilcoId,
              phrase: phrase,
            }, (result) => {
              fs.unlinkSync(tempFilePath);
              resultCallback(formatResponse(reqType, extractedUserId, result));
              res.json(result);
            });
          });
            break;
          case "videoVerification":
              var phrase = req.body.viPhrase;
              var contentLang = req.body.viContentLanguage;
              var tempFilePath = writeFileBuffer(mainThis.options.tempFilePath, req.files[0].buffer, 'mp4', function(){
                mainThis.videoVerification({
                  userId: extractedUserId,
                  contentLanguage: contentLang,
                  phrase: phrase,
                  videoFilePath: tempFilePath
                }, (result) => {
                  fs.unlinkSync(tempFilePath);
                  resultCallback(formatResponse(reqType, extractedUserId, result));
                  res.json(result);
                });
              });
              break;
          case "videoVerificationWithLiveness":
              var phrase = req.body.viPhrase;
              var contentLang = req.body.viContentLanguage;
              var wavFilePath = writeFileBuffer(mainThis.options.tempFilePath, req.files[0].buffer, 'wav', function(){
                var jpgFilePath = writeFileBuffer(mainThis.options.tempFilePath, req.files[1].buffer, 'jpg', function(){
                  mainThis.videoVerificationWithPhoto({
                    userId: extractedUserId,
                    contentLanguage: contentLang,
                    phrase: phrase,
                    audioFilePath: wavFilePath,
                    photoFilePath: jpgFilePath
                  }, (result) => {
                    fs.unlinkSync(wavFilePath);
                    fs.unlinkSync(jpgFilePath);
                    resultCallback(formatResponse(reqType, extractedUserId, result));
                    res.json(result);
                  });
                });
              });
              break;
          default:
              text = "I have never heard of that fruit...";
      }

    });
  }

  /* User API Calls */

  this.createUser = (callback) => {
    this.axiosInstance.post(`${API2_BASE_URL}/users${this.notificationUrl}`)
      .then((httpResponse) => {
        callback(httpResponse.data);
      }).catch((error) => {
        callback(error.response.data);
      });
  };

  this.getLCO = (options, callback) => {
    this.axiosInstance.get(`${LIVENESS_SERVER_BASE_URL}/v1/verification/${options.userId}/${options.contentLanguage}`)
      .then((httpResponse) => {
        callback(httpResponse.data,httpResponse.status);
      }).catch((error) => {
        callback(error.response.data);
      });
  };

  this.checkUserExists = (options, callback) => {
    this.axiosInstance.get(`${API2_BASE_URL}/users/${options.userId}${this.notificationUrl}`)
      .then((httpResponse) => {
        callback(httpResponse.data);
      }).catch((error) => {
        callback(error.response.data);
      });
  };

  this.deleteUser = (options, callback) => {
    this.axiosInstance.delete(`${API2_BASE_URL}/users/${options.userId}${this.notificationUrl}`)
      .then((httpResponse) => {
        callback(httpResponse.data);
      }).catch((error) => {
        callback(error.response.data);
      });
  };

  /* Enrollment API Calls */

  this.getAllVoiceEnrollments = (options, callback) => {
    this.axiosInstance.get(`${API2_BASE_URL}/enrollments/voice/${options.userId}${this.notificationUrl}`)
      .then((httpResponse) => {
        callback(httpResponse.data);
      }).catch((error) => {
        callback(error.response.data);
      });
  };

  this.getAllFaceEnrollments = (options, callback) => {
    this.axiosInstance.get(`${API2_BASE_URL}/enrollments/face/${options.userId}${this.notificationUrl}`)
      .then((httpResponse) => {
        callback(httpResponse.data);
      }).catch((error) => {
        callback(error.response.data);
      });
  };

  this.getAllVideoEnrollments = (options, callback) => {
    this.axiosInstance.get(`${API2_BASE_URL}/enrollments/video/${options.userId}${this.notificationUrl}`)
      .then((httpResponse) => {
        callback(httpResponse.data);
      }).catch((error) => {
        callback(error.response.data);
      });
  };

  this.createVoiceEnrollment = (options, callback) => {
    if (!checkFileExists(options.audioFilePath, callback)) {
      return;
    }

    const form = new FormData();
    form.append('userId', options.userId);
    form.append('contentLanguage', options.contentLanguage);
    form.append('phrase', options.phrase ? options.phrase : '');
    form.append('recording', fs.createReadStream(options.audioFilePath), {
      filename: 'recording.wav',
    });

    this.axiosInstance.post(`${API2_BASE_URL}/enrollments/voice${this.notificationUrl}`, form, {
      headers: form.getHeaders(),
    }).then((httpResponse) => {
      callback(httpResponse.data);
    }).catch((error) => {
      callback(error.response.data);
    });
  };

  this.createFaceEnrollment = (options, callback) => {
    const form = new FormData();
    form.append('userId', options.userId);
    form.append('video', fs.createReadStream(options.videoFilePath));

    this.axiosInstance.post(`${API2_BASE_URL}/enrollments/face`, form, {
      headers: form.getHeaders(),
    }).then((httpResponse) => {
      callback(httpResponse.data);
    }).catch((error) => {
      callback(error.response.data);
    });
  };

  this.createVideoEnrollment = (options, callback) => {
    if (!checkFileExists(options.videoFilePath, callback)) {
      return;
    }

    const form = new FormData();
    form.append('userId', options.userId);
    form.append('contentLanguage', options.contentLanguage);
    form.append('phrase', options.phrase ? options.phrase : '');
    form.append('video', fs.createReadStream(options.videoFilePath), {
      filename: 'video.mp4',
    });

    this.axiosInstance.post(`${API2_BASE_URL}/enrollments/video${this.notificationUrl}`, form, {
      headers: form.getHeaders(),
    }).then((httpResponse) => {
      callback(httpResponse.data);
    }).catch((error) => {
      callback(error.response.data);
    });
  };

   this.deleteAllEnrollments = (options, callback) => {
     this.axiosInstance.delete(`${API2_BASE_URL}/enrollments/${options.userId}/all${this.notificationUrl}`)
       .then((httpResponse) => {
         callback(httpResponse.data);
       }).catch((error) => {
         callback(error.response.data);
       });
   };

  /* Verification API Calls */

  this.voiceVerification = (options, callback) => {
    if (!checkFileExists(options.audioFilePath, callback)) {
      return;
    }

    const form = new FormData();
    form.append('userId', options.userId);
    form.append('contentLanguage', options.contentLanguage);
    form.append('phrase', options.phrase ? options.phrase : '');
    form.append('recording', fs.createReadStream(options.audioFilePath), {
      filename: 'recording.wav',
    });

    this.axiosInstance.post(`${API2_BASE_URL}/verification/voice${this.notificationUrl}`, form, {
      headers: form.getHeaders(),
    }).then((httpResponse) => {
      callback(httpResponse.data);
    }).catch((error) => {
      callback(error.response.data);
    });
  };

  this.faceVerification = (options, callback) => {
    if (!checkFileExists(options.videoFilePath, callback)) {
      return;
    }

    const form = new FormData();
    form.append('userId', options.userId);
    form.append('video', fs.createReadStream(options.videoFilePath), {
      filename: 'video.mp4',
    });

    this.axiosInstance.post(`${API2_BASE_URL}/verification/face${this.notificationUrl}`, form, {
      headers: form.getHeaders(),
    }).then((httpResponse) => {
      callback(httpResponse.data);
    }).catch((error) => {
      callback(error.response.data);
    });
  };

  this.faceVerificationWithPhoto = (options, callback) => {
    if (!checkFileExists(options.photoFilePath, callback)) {
      return;
    }

    const form = new FormData();
    form.append('userId', options.userId);
    form.append('photo', fs.createReadStream(options.photoFilePath), {
      filename: 'photo.jpg',
    });

    this.axiosInstance.post(`${API2_BASE_URL}/verification/face${this.notificationUrl}`, form, {
      headers: form.getHeaders(),
    }).then((httpResponse) => {
      callback(httpResponse.data);
    }).catch((error) => {
      callback(error.response.data);
    });
  };


  this.faceLiveness = (options, callback) => {
      if (!checkFileExists(options.file, callback)) {
        return;
      }
      const form = new FormData();
      form.append('userId', options.userId);
      //form.append('contentLanguage', options.contentLanguage ? options.contentLanguage : 'en-US');
      form.append('lcoId', options.lcoId);
      //form.append('phrase', options.phrase ? options.phrase : '');
      form.append('file', fs.createReadStream(options.file), {
        filename: 'video.mp4',
      });
      this.axiosInstance.post(`${LIVENESS_SERVER_BASE_URL}/v1/verification/face`, form, {
        headers: form.getHeaders(),
      }).then((httpResponse) => {
        callback(httpResponse.data);
      }).catch((error) => {
        callback(error.response.data);
      });
    }

    this.videoLiveness = (options, callback) => {
        if (!checkFileExists(options.file, callback)) {
          return;
        }
        const form = new FormData();
        form.append('userId', options.userId);
        form.append('contentLanguage', options.contentLanguage ? options.contentLanguage : 'en-US');
        form.append('lcoId', options.lcoId);
        form.append('phrase', options.phrase ? options.phrase : '');
        form.append('file', fs.createReadStream(options.file), {
          filename: 'video.mp4',
        });
        this.axiosInstance.post(`${LIVENESS_SERVER_BASE_URL}/v1/verification/video`, form, {
          headers: form.getHeaders(),
        }).then((httpResponse) => {
          callback(httpResponse.data);
        }).catch((error) => {
          callback(error.response.data);
        });
      }


  this.videoVerification = (options, callback) => {
    if (!checkFileExists(options.videoFilePath, callback)) {
      return;
    }

    const form = new FormData();
    form.append('userId', options.userId);
    form.append('contentLanguage', options.contentLanguage);
    form.append('phrase', options.phrase ? options.phrase : '');
    form.append('video', fs.createReadStream(options.videoFilePath), {
      filename: 'video.mp4',
    });
    this.axiosInstance.post(`${API2_BASE_URL}/verification/video${this.notificationUrl}`, form, {
      headers: form.getHeaders(),
    }).then((httpResponse) => {
      callback(httpResponse.data);
    }).catch((error) => {
      callback(error.response.data);
    });
  };

  this.videoVerificationWithPhoto = (options, callback) => {
    if (!checkFileExists(options.audioFilePath, callback)) {
      return;
    }
    if (!checkFileExists(options.photoFilePath, callback)) {
      return;
    }

    const form = new FormData();
    form.append('userId', options.userId);
    form.append('contentLanguage', options.contentLanguage);
    form.append('phrase', options.phrase ? options.phrase : '');
    form.append('audio', fs.createReadStream(options.audioFilePath), {
      filename: 'audio.wav',
    });
    form.append('photo', fs.createReadStream(options.photoFilePath), {
      filename: 'photo.jpg',
    });
    this.axiosInstance.post(`${API2_BASE_URL}/verification/video${this.notificationUrl}`, form, {
      headers: form.getHeaders(),
    }).then((httpResponse) => {
      callback(httpResponse.data);
    }).catch((error) => {
      callback(error.response.data);
    });
  };

}

module.exports = VoiceIt2;
