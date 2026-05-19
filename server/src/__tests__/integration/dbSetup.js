const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');

let mongod;

async function connect() {
  mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri());
}

async function disconnect() {
  await mongoose.disconnect();
  if (mongod) await mongod.stop();
}

async function clearCollections() {
  for (const collection of Object.values(mongoose.connection.collections)) {
    await collection.deleteMany({});
  }
}

module.exports = { connect, disconnect, clearCollections };
