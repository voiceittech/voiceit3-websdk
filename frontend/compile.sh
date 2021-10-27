#!/bin/bash
npm run build
cp dist/voiceit2.min.js ../dist/voiceit2.min.js
cp dist/voiceit2.min.js ../node-server-example/public/js/voiceit2.min.js
cp dist/voiceit2.min.js ../php-server-example/js/voiceit2.min.js
cp dist/voiceit2.min.js ../go-server-example/public/js/voiceit2.min.js
rm dist/voiceit2.min.js.LICENSE.txt
