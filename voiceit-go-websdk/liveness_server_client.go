package websdk

import (
	"bytes"
	"encoding/json"
	"errors"
	"io/ioutil"
	"mime/multipart"
	"net/http"

	"github.com/voiceittech/VoiceIt2-WebSDK/voiceit-go-websdk/utils"
)

type LivenessServerClient struct {
	APIKey   string
	APIToken string
	BaseUrl  string
}
type GenerateLCORequestReturn struct {
	Success      bool   `json:"success"`
	Message      string `json:"message"`
	LCOId        string `json:"lcoId"`
	ResponseCode string `json:"responseCode"`
}

func (livenessServerClient LivenessServerClient) GenerateLCORequest(userId, contentLanguage string) (lcoId string, retErrr error) {

	req, err := http.NewRequest("GET", livenessServerClient.BaseUrl+"/v1/verification/"+userId+"/"+contentLanguage, nil)

	req.SetBasicAuth(livenessServerClient.APIKey, livenessServerClient.APIToken)

	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		return "", errors.New("client.Do(req) Exception: " + err.Error())
	}
	defer resp.Body.Close()
	reply, err := ioutil.ReadAll(resp.Body)
	if err != nil {
		return "", errors.New("ioutil.ReadAll(resp.Body) Exception: " + err.Error())
	}

	var generateLCO GenerateLCORequestReturn
	if err := json.Unmarshal(reply, &generateLCO); err != nil {
		return "", errors.New(`json.Unmarshal([]byte("` + string(reply) + `"), &generateLCO) Exception: ` + err.Error())
	}

	if !generateLCO.Success {
		return "", errors.New(`Generate LCO Request failed with JSON Response: ` + string(reply))
	}

	return generateLCO.LCOId, nil
}

type VideoProcessingRequestReturn struct {
	ProcessLivenessVideoReturnV1
	JSON           []byte
	HTTPStatusCode int
	Error          error
}

type ProcessLivenessVideoReturnV1 struct {
	Success          bool   `json:"success"`
	UIMessage        string `json:"uiMessage"`
	DeveloperMessage string `json:"developerMessage"`
	Retry            bool   `json:"retry"`
	AudioPrompt      string `json:"audioPrompt"`
	DebugFileLink    string `json:"debugFileLink"`
	ResponseCode     string `json:"responseCode"`
}

func (livenessServerClient LivenessServerClient) VideoProcessingRequest(lcoId, userId, biometricType string, fileData []byte, phrase ...string) VideoProcessingRequestReturn {

	var ret VideoProcessingRequestReturn

	fileName := utils.GenerateRandomHash(32) + ".mp4"

	body := &bytes.Buffer{}
	writer := multipart.NewWriter(body)

	part, err := writer.CreateFormFile("file", fileName)
	if err != nil {
		ret.Error = errors.New(`writer.CreateFormFile("file", "` + fileName + `") Exception: ` + err.Error())
		return ret
	}
	if _, err := part.Write(fileData); err != nil {
		ret.Error = errors.New(`part.Write(fileContents) Exception: ` + err.Error())
		return ret
	}

	if err := writer.WriteField("userId", userId); err != nil {
		ret.Error = errors.New(`writer.WriteField("userId", "` + userId + `") Exception: ` + err.Error())
		return ret
	}

	if biometricType == "video" {

		if len(phrase) < 1 || phrase[0] == "" {
			ret.Error = errors.New(`phrase not passed for video Liveness Verification Exception: ` + err.Error())
			return ret
		}

		if err := writer.WriteField("phrase", phrase[0]); err != nil {
			ret.Error = errors.New(`writer.WriteField("phrase", "` + phrase[0] + `") Exception: ` + err.Error())
			return ret
		}
	}

	if err := writer.WriteField("lcoId", lcoId); err != nil {
		ret.Error = errors.New(`writer.WriteField("lcoId", "` + lcoId + `") Exception: ` + err.Error())
		return ret
	}

	writer.Close()

	req, err := http.NewRequest("POST", livenessServerClient.BaseUrl+"/v1/verification/"+biometricType, body)
	if err != nil {
		ret.Error = errors.New(`http.NewRequest("POST", "` + livenessServerClient.BaseUrl + "/v1/verification/" + biometricType + `", body) Exception: ` + err.Error())
		return ret
	}
	req.SetBasicAuth(livenessServerClient.APIKey, livenessServerClient.APIToken)
	req.Header.Add("Content-Type", writer.FormDataContentType())
	req.Header.Add("platformId", "52")

	req.Header.Add("platformVersion", platformVersion)

	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		ret.Error = errors.New(`client.Do(req) Exception: ` + err.Error())
		return ret
	}

	ret.HTTPStatusCode = resp.StatusCode

	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		ret.Error = errors.New(`Liveness Server returned failed HTTP Response Code: ` + resp.Status)
		return ret
	}

	defer resp.Body.Close()
	reply, err := ioutil.ReadAll(resp.Body)
	if err != nil {
		ret.Error = errors.New(`ioutil.ReadAll(resp.Body) Exception: ` + err.Error())
		return ret
	}

	ret.JSON = reply

	if err := json.Unmarshal(reply, &ret.ProcessLivenessVideoReturnV1); err != nil {
		ret.Error = errors.New(`json.Unmarshal([]byte("` + string(reply) + `"), &ret.ProcessLivenessVideoReturnV1) Exception: ` + err.Error())
		return ret
	}

	return ret

}
