package main

import (
	"encoding/json"
	"fmt"
	"io/ioutil"
	"log"
	"net/http"
	"os"

	"github.com/go-chi/chi"
	"github.com/go-chi/chi/middleware"

	websdk "github.com/voiceittech/VoiceIt2-WebSDK/voiceit-go-websdk"
)

const (
	HTTP_PORT = "3000"
)

var (
	backend      websdk.WebSDK
	consoleBytes []byte
	faviconBytes []byte
)

func init() {
	bytes, err := ioutil.ReadFile("./views/console.html")
	if err != nil {
		log.Fatal(err.Error())
	}

	consoleBytes = bytes

	bytes, err = ioutil.ReadFile("./public/images/favicon.ico")
	if err != nil {
		log.Fatal(err.Error())
	}
	faviconBytes = bytes

	backend.Initialize(
		VOICEIT_API_KEY,
		VOICEIT_API_TOKEN,
		SESSION_EXPIRATION_TIME_HOURS,
	)
}

func main() {

	r := chi.NewRouter()
	r.Use(middleware.RealIP)
	r.Use(middleware.RequestID)
	r.Use(middleware.Recoverer)
	r.Use(middleware.Logger)

	r.Get("/favicon.ico", func(w http.ResponseWriter, req *http.Request) { w.Write(faviconBytes) })

	r.Get("/login", func(w http.ResponseWriter, req *http.Request) {

		ret := make(map[string]interface{})

		if req.URL.Query().Get("email") != DEMO_EMAIL {
			ret["responseCode"] = "UNFD"
			ret["message"] = "User not found. Please make sure you entered the right userId and API credentials in config.go"
			marshaled, _ := json.Marshal(ret)
			w.Write(marshaled)
			return
		}

		if req.URL.Query().Get("password") != DEMO_PASSWORD {
			ret["responseCode"] = "INPW"
			ret["message"] = "Incorrect Password"
			marshaled, _ := json.Marshal(ret)
			w.Write(marshaled)
			return
		}

		if VOICEIT_TEST_USER_ID[:4] == "usr_" {
			tok, err := backend.GenerateTokenForUser(VOICEIT_TEST_USER_ID)
			if err != nil {
				log.Println(`backend.GenerateTokenForUser("` + VOICEIT_TEST_USER_ID + `") Exception: ` + err.Error())
				ret["responseCode"] = "BERR"
				ret["message"] = "Unable to generate secure token."
				marshaled, _ := json.Marshal(ret)
				w.Write(marshaled)
				return
			}
			ret["token"] = tok
		}

		ret["responseCode"] = "SUCC"
		ret["message"] = "Successfully authenticated user"
		marshaled, _ := json.Marshal(ret)
		w.Write(marshaled)

	})

	r.Get("/logout", func(w http.ResponseWriter, req *http.Request) {
		// No cookie sessions need to be reset since all sessions handled inside custom client wrapper code in frontend
		http.Redirect(w, req, "/", 302)
	})

	r.Get("/console", func(w http.ResponseWriter, req *http.Request) { w.Write(consoleBytes) })

	r.Post("/example_endpoint", backend.MakeCall)
	r.Post("/example_endpoint/", backend.MakeCall)

	r.Get("/content_language", func(w http.ResponseWriter, req *http.Request) {
		ret := make(map[string]string)
		ret["contentLanguage"] = CONTENT_LANGUAGE
		marshaled, _ := json.Marshal(ret)
		w.Write(marshaled)
	})

	fileServer(r)

	fmt.Println("Serving VoiceIt WebSDK Example at port :" + HTTP_PORT)
	log.Fatal(http.ListenAndServe(":"+HTTP_PORT, r))
}

func fileServer(router *chi.Mux) {
	root := "public/"
	fs := http.FileServer(http.Dir(root))

	router.Get("/*", func(w http.ResponseWriter, r *http.Request) {
		if _, err := os.Stat(root + r.RequestURI); os.IsNotExist(err) {
			http.StripPrefix(r.RequestURI, fs).ServeHTTP(w, r)
		} else {
			fs.ServeHTTP(w, r)
		}
	})
}
