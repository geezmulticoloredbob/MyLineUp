const mongoose = require('mongoose');
const env = require('./env');

// Ensure SRV lookups work regardless of the system DNS resolver
require('dns').setServers(['8.8.8.8']);

async function connectToDatabase() {
  if (!env.mongoUri) {
    throw new Error('MONGODB_URI is not configured');
  }

  await mongoose.connect(env.mongoUri);
  return mongoose.connection;
}

module.exports = {
  connectToDatabase,
};
