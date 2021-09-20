package websdk

import (
	"net/http"

	voiceit2 "github.com/voiceittech/VoiceIt2-Go/v2"
)

const (
	platformVersion = "0.0.1"
)

type BaseUrls struct {
	API2           string
	LivenessServer string
}

type Backend struct {
	vi                   voiceit2.VoiceIt2
	livenessServerClient LivenessServerClient
}

func (backend *Backend) Initialize(apiKey, apiToken string, baseUrls BaseUrls) {

	var api2BaseUrl, livenessServerBaseUrl string
	if baseUrls.API2 != "" {
		api2BaseUrl = baseUrls.API2
	} else {
		api2BaseUrl = "https://api.voiceit.io"
	}

	if baseUrls.LivenessServer != "" {
		livenessServerBaseUrl = baseUrls.LivenessServer
	} else {
		livenessServerBaseUrl = "https://liveness.voiceit.io"
	}

	backend.vi = voiceit2.VoiceIt2{
		APIKey:   apiKey,
		APIToken: apiToken,
		BaseUrl:  api2BaseUrl,
	}

	backend.livenessServerClient = LivenessServerClient{
		APIKey:   apiKey,
		APIToken: apiToken,
		BaseUrl:  livenessServerBaseUrl,
	}
}

func (backend Backend) MakeCall(w http.ResponseWriter, r *http.Request) {
}
