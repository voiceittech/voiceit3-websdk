// Example server configuration. All values should be provided via
// environment variables — the hardcoded fallbacks exist only so the
// example fails with an obvious error when the caller forgot to set them.
// Do NOT deploy this server with these fallbacks in place.

function requireEnv(name) {
  const v = process.env[name];
  if (!v) {
    throw new Error(
      'Required environment variable ' + name + ' is not set. ' +
      'This example expects real values — see .env.example for the full list.'
    );
  }
  return v;
}

const config = {
  VOICEIT_API_KEY: requireEnv('VOICEIT_THREE_API_KEY'),
  VOICEIT_API_TOKEN: requireEnv('VOICEIT_THREE_API_TOKEN'),
  VOICEIT_TEST_USER_ID: requireEnv('VOICEIT_TEST_USER_ID'),
  DEMO_EMAIL: requireEnv('DEMO_EMAIL'),
  DEMO_PASSWORD: requireEnv('DEMO_PASSWORD'),
  SESSION_EXPIRATION_TIME_HOURS: parseInt(process.env.SESSION_EXPIRATION_TIME_HOURS || '1', 10),
  CONTENT_LANGUAGE: process.env.CONTENT_LANGUAGE || 'no-STT'
};

module.exports = config;
