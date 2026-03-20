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
};
