require('dotenv').config();

const env = require('./config/env');
const { findEnvProblems } = require('./config/validateEnv');

const envProblems = findEnvProblems(env, process.env);
if (envProblems.length) {
  envProblems.forEach((problem) => console.error(`FATAL: ${problem}`));
  process.exit(1);
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
