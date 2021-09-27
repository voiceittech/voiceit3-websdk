package websdk

import (
	"bytes"
	"errors"
	"io/ioutil"
	"mime/multipart"
	"net/http"
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

func (livenessServerClient LivenessServerClient) GenerateLCORequest(userId, contentLanguage string) ([]byte, error) {

	req, err := http.NewRequest("GET", livenessServerClient.BaseUrl+"/v1/verification/"+userId+"/"+contentLanguage, nil)

	req.SetBasicAuth(livenessServerClient.APIKey, livenessServerClient.APIToken)

	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		return []byte{}, errors.New("client.Do(req) Exception: " + err.Error())
	}

	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		return []byte{}, errors.New(`Liveness Server returned failed HTTP Response Code: ` + resp.Status)
	}

	defer resp.Body.Close()
	reply, err := ioutil.ReadAll(resp.Body)
	if err != nil {
		return []byte{}, errors.New("ioutil.ReadAll(resp.Body) Exception: " + err.Error())
	}

	return reply, nil
}

func (livenessServerClient LivenessServerClient) VideoProcessingRequest(userId, lcoId, biometricType, filename string, fileData []byte, phrase ...string) ([]byte, error) {

	body := &bytes.Buffer{}
	writer := multipart.NewWriter(body)

	part, err := writer.CreateFormFile("file", filename)
	if err != nil {
		return []byte{}, errors.New(`writer.CreateFormFile("file", "` + filename + `") Exception: ` + err.Error())
	}
	if _, err := part.Write(fileData); err != nil {
		return []byte{}, errors.New(`part.Write(fileContents) Exception: ` + err.Error())
	}

	if err := writer.WriteField("userId", userId); err != nil {
		return []byte{}, errors.New(`writer.WriteField("userId", "` + userId + `") Exception: ` + err.Error())
	}

	if biometricType == "video" {

		if len(phrase) < 1 || phrase[0] == "" {
			return []byte{}, errors.New(`phrase not passed for video Liveness Verification Exception: ` + err.Error())
		}

		if err := writer.WriteField("phrase", phrase[0]); err != nil {
			return []byte{}, errors.New(`writer.WriteField("phrase", "` + phrase[0] + `") Exception: ` + err.Error())
		}
	}

	if err := writer.WriteField("lcoId", lcoId); err != nil {
		return []byte{}, errors.New(`writer.WriteField("lcoId", "` + lcoId + `") Exception: ` + err.Error())
	}

	writer.Close()

	req, err := http.NewRequest("POST", livenessServerClient.BaseUrl+"/v1/verification/"+biometricType, body)
	if err != nil {
		return []byte{}, errors.New(`http.NewRequest("POST", "` + livenessServerClient.BaseUrl + "/v1/verification/" + biometricType + `", body) Exception: ` + err.Error())
	}
	req.SetBasicAuth(livenessServerClient.APIKey, livenessServerClient.APIToken)
	req.Header.Add("Content-Type", writer.FormDataContentType())
	req.Header.Add("platformId", platformId)

	req.Header.Add("platformVersion", platformVersion)

	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		return []byte{}, errors.New(`client.Do(req) Exception: ` + err.Error())
	}

	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		return []byte{}, errors.New(`Liveness Server returned failed HTTP Response Code: ` + resp.Status)
	}

	defer resp.Body.Close()
	reply, err := ioutil.ReadAll(resp.Body)
	if err != nil {
		return []byte{}, errors.New(`ioutil.ReadAll(resp.Body) Exception: ` + err.Error())
	}

	return reply, nil
}
