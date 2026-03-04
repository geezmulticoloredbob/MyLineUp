function getEnv(name, fallback = '') {
  return process.env[name] || fallback;
}

module.exports = {
  port: getEnv('PORT', '5000'),
  nodeEnv: getEnv('NODE_ENV', 'development'),
  mongoUri: getEnv('MONGODB_URI'),
  jwtSecret: getEnv('JWT_SECRET'),
};

