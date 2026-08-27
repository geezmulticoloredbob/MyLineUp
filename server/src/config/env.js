function getEnv(name, fallback = '') {
  return process.env[name] || fallback;
}

module.exports = {
  port: getEnv('PORT', '5000'),
  nodeEnv: getEnv('NODE_ENV', 'development'),
  mongoUri: getEnv('MONGODB_URI'),
  jwtSecret: getEnv('JWT_SECRET'),
  clientUrl: getEnv('CLIENT_URL', 'http://localhost:5173'),
  footballApiKey: getEnv('FOOTBALL_API_KEY'),
  basketballApiKey: getEnv('BASKETBALL_API_KEY'),
  // Opt-in only — some local Windows setups fail Atlas SRV lookups against the
  // system resolver. Not something a hosting platform should inherit by default:
  // it rewrites DNS for the whole process, not just the Mongo driver.
  dnsServers: getEnv('DNS_SERVERS', ''),
};
