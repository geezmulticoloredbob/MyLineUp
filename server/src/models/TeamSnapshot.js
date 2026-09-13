const mongoose = require('mongoose');
const leagues = require('../constants/leagues');

// One row per followed team per day — captured by the scheduled refresh job
// (see services/snapshotService.js) so trend/history features have something
// to read that no live third-party lookup can give us: what this team's
// state looked like over time, not just right now.
const teamSnapshotSchema = new mongoose.Schema(
  {
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
    // 'YYYY-MM-DD' (UTC) — a plain string key keeps the daily-dedup upsert
    // and the unique index simple, and matches the GitHub Actions cron's
    // own UTC schedule.
    capturedOn: {
      type: String,
      required: true,
    },
    latestResult: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    ladderPosition: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    stats: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

teamSnapshotSchema.index({ league: 1, teamId: 1, capturedOn: 1 }, { unique: true });

module.exports = mongoose.model('TeamSnapshot', teamSnapshotSchema);
