require('dotenv').config();

const app = require('./app');
const env = require('./config/env');
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
