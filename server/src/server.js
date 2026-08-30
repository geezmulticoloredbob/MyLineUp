require('dotenv').config();

const env = require('./config/env');
const { findEnvProblems } = require('./config/validateEnv');

const envProblems = findEnvProblems(env, process.env);
if (envProblems.length) {
  envProblems.forEach((problem) => console.error(`FATAL: ${problem}`));
  process.exit(1);
}

const app = require('./app');
const { connectToDatabase, disconnectFromDatabase } = require('./config/db');
const { createGracefulShutdown } = require('./gracefulShutdown');

async function startServer() {
  await connectToDatabase();

  const server = app.listen(env.port, () => {
    console.log(`Server listening on port ${env.port}`);
  });

  const shutdown = createGracefulShutdown({ server, closeDatabase: disconnectFromDatabase });
  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

startServer().catch((error) => {
  console.error('Failed to start server', error);
  process.exit(1);
});
