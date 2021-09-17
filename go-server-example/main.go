package main

import (
	"fmt"
	"log"
	"net/http"
	"os"

	"github.com/go-chi/chi"
	"github.com/go-chi/chi/middleware"
	websdk "github.com/voiceittech/VoiceIt2-WebSDK/voiceit-go-websdk"
)

const (
	HTTP_PORT = "8080"
)

func main() {

	r := chi.NewRouter()
	r.Use(middleware.RealIP)
	r.Use(middleware.RequestID)
	r.Use(middleware.Recoverer)
	r.Use(middleware.Logger)

	r.Post("/", websdk.MakeCall)

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
