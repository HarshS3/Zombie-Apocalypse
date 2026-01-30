const mongoose = require('mongoose');

const SabotageLogSchema = new mongoose.Schema({
  initiatorTeamId: { type: mongoose.Schema.Types.ObjectId, ref: 'Team' },
  targetPlayerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  timestamp: { type: Date, default: Date.now },
  success: { type: Boolean, required: true }
});

module.exports = mongoose.model('SabotageLog', SabotageLogSchema);
