const mongoose = require('mongoose');

const MatchStateSchema = new mongoose.Schema({
  round: { type: Number, default: 1 }, // 1 or 2
  round1StartTime: { type: Date },
  round2StartTime: { type: Date },
  isPaused: { type: Boolean, default: false },
  round1Timer: { type: Number, default: 3000 }, // 50 mins in seconds
  activeZoneId: { type: mongoose.Schema.Types.ObjectId, ref: 'Zone' }, // For Round 2
  humanTotalDominationTime: { type: Number, default: 0 }, // minutes
  zombieTotalDominationTime: { type: Number, default: 0 } // minutes
});

module.exports = mongoose.model('MatchState', MatchStateSchema);
