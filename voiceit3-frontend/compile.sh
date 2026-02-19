#!/bin/bash
npm run build
cp dist/voiceit3.min.js ../voiceit3-dist/voiceit3.min.js
cp dist/voiceit3.min.js ../voiceit3-node-server-example/public/js/voiceit3.min.js
cp dist/voiceit3.min.js ../voiceit3-php-server-example/js/voiceit3.min.js
cp dist/voiceit3.min.js ../voiceit3-go-server-example/public/js/voiceit3.min.js
rm dist/voiceit3.min.js.LICENSE.txt
