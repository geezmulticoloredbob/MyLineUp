/**
 * Creates (or resets) a demo account for testing.
 * Usage: node scripts/seedDemo.js
 *
 * Credentials:  demo@mylineup.com / demo1234
 */

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
require('dns').setServers(['8.8.8.8']);

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../src/models/User');
const Favourite = require('../src/models/Favourite');

const DEMO_EMAIL = 'demo@mylineup.com';
const DEMO_PASSWORD = 'demo1234';
const DEMO_USERNAME = 'Demo User';

const DEMO_FAVOURITES = [
  { league: 'NBA', teamId: 'nba-bos', teamName: 'Boston Celtics' },
  { league: 'NBA', teamId: 'nba-lal', teamName: 'Los Angeles Lakers' },
  { league: 'EPL', teamId: 'epl-ars', teamName: 'Arsenal' },
  { league: 'EPL', teamId: 'epl-liv', teamName: 'Liverpool' },
  { league: 'AFL', teamId: 'afl-col', teamName: 'Collingwood' },
  { league: 'AFL', teamId: 'afl-ric', teamName: 'Richmond' },
];

async function seed() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to MongoDB');

  // Upsert demo user
  const hashed = await bcrypt.hash(DEMO_PASSWORD, 10);
  let user = await User.findOne({ email: DEMO_EMAIL });
  if (user) {
    await User.updateOne({ _id: user._id }, { password: hashed, username: DEMO_USERNAME });
    console.log('Demo user updated');
  } else {
    user = await User.create({ username: DEMO_USERNAME, email: DEMO_EMAIL, password: hashed });
    console.log('Demo user created');
  }

  // Clear and re-seed favourites
  await Favourite.deleteMany({ user: user._id });
  await Favourite.insertMany(DEMO_FAVOURITES.map((f) => ({ ...f, user: user._id })));
  console.log(`Seeded ${DEMO_FAVOURITES.length} favourite teams`);

  console.log('\n  Email:    demo@mylineup.com');
  console.log('  Password: demo1234\n');

  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
