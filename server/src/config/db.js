const mongoose = require('mongoose');
const env = require('./env');

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
