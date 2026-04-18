module voiceit3-go-server-example

go 1.22

toolchain go1.24.13

require (
	github.com/go-chi/chi/v5 v5.2.4
	github.com/voiceittech/voiceit3-web-sdk/voiceit3-go-websdk v0.0.0-20210928010912-eafefa66b3ae
)

require (
	github.com/golang-jwt/jwt/v5 v5.3.1 // indirect
	github.com/voiceittech/voiceit3-go/v3 v3.0.7 // indirect
)

replace github.com/voiceittech/voiceit3-web-sdk/voiceit3-go-websdk => ../voiceit3-go-websdk
