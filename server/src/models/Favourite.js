const mongoose = require('mongoose');
const leagues = require('../constants/leagues');

const favouriteSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    league: {
      type: String,
      enum: leagues,
      required: true,
    },
    teamId: {
      type: String,
      required: true,
      trim: true,
    },
    teamName: {
      type: String,
      required: true,
      trim: true,
    },
    teamLogoUrl: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

favouriteSchema.index({ user: 1, league: 1, teamId: 1 }, { unique: true });

module.exports = mongoose.model('Favourite', favouriteSchema);
