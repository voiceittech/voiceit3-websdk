#!/bin/bash
yarn build
cp dist/voiceit2.min.js ../dist/voiceit2.min.js
cp dist/voiceit2.min.js ../node-example/public/js/voiceit2.min.js
cp dist/voiceit2.min.js ../php-example/js/voiceit2.min.js
