const mongoose = require('mongoose');

const ZoneSchema = new mongoose.Schema({
  name: { type: String, enum: ['A', 'B', 'C'], required: true },
  isActive: { type: Boolean, default: false },
  dominationStatus: { type: String, enum: ['neutral', 'human', 'zombie'], default: 'neutral' },
  humanScore: { type: Number, default: 0 },
  zombieScore: { type: Number, default: 0 },
  // Track individual difficulty counts
  humanDifficulty: {
    E: { type: Number, default: 0 },
    M: { type: Number, default: 0 },
    H: { type: Number, default: 0 }
  },
  zombieDifficulty: {
    E: { type: Number, default: 0 },
    M: { type: Number, default: 0 },
    H: { type: Number, default: 0 }
  },
  // Domination time tracking (in seconds)
  humanTotalDominationTime: { type: Number, default: 0 },
  zombieTotalDominationTime: { type: Number, default: 0 },
  currentDominationStartTime: { type: Date, default: null },
  lastDominationStatus: { type: String, enum: ['neutral', 'human', 'zombie'], default: 'neutral' },
  currentCycleStartTime: { type: Date },
  weightage: { type: Number, default: 1 }
});

module.exports = mongoose.model('Zone', ZoneSchema);
