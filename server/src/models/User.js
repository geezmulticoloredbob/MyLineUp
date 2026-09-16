const mongoose = require('mongoose');
const leagues = require('../constants/leagues');

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 30,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
      minlength: 8,
    },
    followedLeagues: {
      type: [String],
      enum: leagues,
      default: [],
    },
    onboardingComplete: {
      type: Boolean,
      default: false,
    },
    iconId: {
      type: String,
      default: 'football',
    },
    passwordResetTokenHash: {
      type: String,
      default: undefined,
    },
    passwordResetExpires: {
      type: Date,
      default: undefined,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('User', userSchema);
