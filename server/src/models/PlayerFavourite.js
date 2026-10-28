const mongoose = require('mongoose');
const leagues = require('../constants/leagues');

const playerFavouriteSchema = new mongoose.Schema(
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
    playerId: {
      type: String,
      required: true,
      trim: true,
    },
    playerName: {
      type: String,
      required: true,
      trim: true,
    },
    teamId: {
      type: String,
      required: true,
      trim: true,
    },
    teamName: {
      type: String,
      default: '',
    },
    position: {
      type: String,
      default: '',
    },
    headshotUrl: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

playerFavouriteSchema.index({ user: 1, league: 1, playerId: 1 }, { unique: true });

module.exports = mongoose.model('PlayerFavourite', playerFavouriteSchema);
