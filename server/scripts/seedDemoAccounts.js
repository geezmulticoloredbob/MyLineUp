/**
 * Creates (or resets) a handful of demo accounts spanning all 14 leagues,
 * so the app has varied, realistic-looking data to show off — separate from
 * the single demo@mylineup.com account created by seedDemo.js.
 *
 * Usage: node scripts/seedDemoAccounts.js
 *
 * All accounts share the password: Demo1234
 */

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
require('dns').setServers(['8.8.8.8']);

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../src/models/User');
const Favourite = require('../src/models/Favourite');

const SHARED_PASSWORD = 'Demo1234';

const PERSONAS = [
  {
    email: 'demo.hoops@mylineup.com',
    username: 'Sam Hoops',
    iconId: 'basketball',
    followedLeagues: ['NBA'],
    favourites: [
      { league: 'NBA', teamId: 'nba-bos', teamName: 'Boston Celtics' },
      { league: 'NBA', teamId: 'nba-gsw', teamName: 'Golden State Warriors' },
    ],
  },
  {
    email: 'demo.football@mylineup.com',
    username: 'Priya Pitch',
    iconId: 'trophy',
    followedLeagues: ['EPL', 'UCL'],
    favourites: [
      { league: 'EPL', teamId: 'epl-ars', teamName: 'Arsenal' },
      { league: 'EPL', teamId: 'epl-liv', teamName: 'Liverpool' },
      { league: 'UCL', teamId: 'ucl-mci', teamName: 'Manchester City' },
    ],
  },
  {
    email: 'demo.usa@mylineup.com',
    username: 'Jordan States',
    iconId: 'flame',
    followedLeagues: ['NFL', 'NHL', 'MLB'],
    favourites: [
      { league: 'NFL', teamId: 'nfl-kc', teamName: 'Kansas City Chiefs' },
      { league: 'NHL', teamId: 'nhl-bos', teamName: 'Boston Bruins' },
      { league: 'MLB', teamId: 'mlb-bos', teamName: 'Boston Red Sox' },
    ],
  },
  {
    email: 'demo.europe@mylineup.com',
    username: 'Marco Europa',
    iconId: 'star',
    followedLeagues: ['LALIGA', 'BUNDESLIGA', 'SERIEA', 'LIGUE1'],
    favourites: [
      { league: 'LALIGA', teamId: 'lla-rma', teamName: 'Real Madrid' },
      { league: 'BUNDESLIGA', teamId: 'bun-bay', teamName: 'Bayern Munich' },
      { league: 'SERIEA', teamId: 'ser-int', teamName: 'Inter Milan' },
      { league: 'LIGUE1', teamId: 'l1-psg', teamName: 'Paris Saint-Germain' },
    ],
  },
  {
    email: 'demo.global@mylineup.com',
    username: 'Ana Oceania',
    iconId: 'crown',
    followedLeagues: ['AFL', 'WC', 'CHAMPIONSHIP', 'EREDIVISIE'],
    favourites: [
      { league: 'AFL', teamId: 'afl-col', teamName: 'Collingwood' },
      { league: 'WC', teamId: 'wc-bra', teamName: 'Brazil' },
      { league: 'CHAMPIONSHIP', teamId: 'cha-lei', teamName: 'Leicester City' },
      { league: 'EREDIVISIE', teamId: 'ere-ajx', teamName: 'Ajax' },
    ],
  },
];

async function seedPersona(hashedPassword, persona) {
  let user = await User.findOne({ email: persona.email });

  if (user) {
    await User.updateOne(
      { _id: user._id },
      {
        password: hashedPassword,
        username: persona.username,
        iconId: persona.iconId,
        onboardingComplete: true,
        followedLeagues: persona.followedLeagues,
      }
    );
    console.log(`Updated ${persona.email}`);
  } else {
    user = await User.create({
      username: persona.username,
      email: persona.email,
      password: hashedPassword,
      iconId: persona.iconId,
      onboardingComplete: true,
      followedLeagues: persona.followedLeagues,
    });
    console.log(`Created ${persona.email}`);
  }

  await Favourite.deleteMany({ user: user._id });
  await Favourite.insertMany(persona.favourites.map((f) => ({ ...f, user: user._id })));
  console.log(`  Seeded ${persona.favourites.length} favourite team(s)`);
}

async function seed() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to MongoDB');

  const hashedPassword = await bcrypt.hash(SHARED_PASSWORD, 10);
  for (const persona of PERSONAS) {
    await seedPersona(hashedPassword, persona);
  }

  console.log(`\nAll demo accounts share the password: ${SHARED_PASSWORD}\n`);
  console.log(PERSONAS.map((p) => `  ${p.email}`).join('\n'));

  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
