require('dotenv').config();

const env = require('./config/env');

const REQUIRED_ENV = ['MONGODB_URI', 'JWT_SECRET'];
for (const key of REQUIRED_ENV) {
  if (!process.env[key]) {
    console.error(`FATAL: missing required environment variable: ${key}`);
    process.exit(1);
  }
}

const app = require('./app');
const { connectToDatabase } = require('./config/db');

async function startServer() {
  await connectToDatabase();

  app.listen(env.port, () => {
    console.log(`Server listening on port ${env.port}`);
  });
}

startServer().catch((error) => {
  console.error('Failed to start server', error);
  process.exit(1);
});
