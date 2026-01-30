const mongoose = require('mongoose');

const TeamSchema = new mongoose.Schema({
  name: { type: String, required: true }, // e.g., "Lab 1 Team" or "Humans"
  faction: { type: String, enum: ['neutral', 'human', 'zombie'], default: 'neutral' }, // Neutral for Round 1
  score: { type: Number, default: 0 },
  sabotagesUsed: { type: Number, default: 0 },
  lastSabotageTime: { type: Date }
});

module.exports = mongoose.model('Team', TeamSchema);
