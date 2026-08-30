const mongoose = require('mongoose');
const env = require('./env');

// Opt-in workaround for local resolvers that fail Atlas SRV lookups (set
// DNS_SERVERS=8.8.8.8 in server/.env if you hit this). Left off by default —
// this rewrites DNS for the whole process, not just the Mongo driver, so it
// should not run unconditionally on a hosting platform's network.
if (env.dnsServers) {
  require('dns').setServers(env.dnsServers.split(',').map((s) => s.trim()));
}

async function connectToDatabase() {
  if (!env.mongoUri) {
    throw new Error('MONGODB_URI is not configured');
  }

  await mongoose.connect(env.mongoUri);
  return mongoose.connection;
}

async function disconnectFromDatabase() {
  await mongoose.connection.close();
}

module.exports = {
  connectToDatabase,
  disconnectFromDatabase,
};
