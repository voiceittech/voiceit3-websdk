const config = {
  VOICEIT_API_KEY : process.env.VOICEIT_TWO_API_KEY || "API_KEY_HERE",
  VOICEIT_API_TOKEN : process.env.VOICEIT_TWO_API_TOKEN || "API_TOKEN_HERE",
  VOICEIT_TEST_USER_ID : process.env.VOICEIT_TEST_USER_ID || "TEST_USER_ID_HERE",
  DEMO_EMAIL : "demo@voiceit.io",
  DEMO_PASSWORD : "demo123",
  SESSION_EXPIRATION_TIME_HOURS :1
};

module.exports = config;
