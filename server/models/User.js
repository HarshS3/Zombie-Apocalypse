const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  role: { type: String, enum: ['admin', 'player', 'lab_monitor'], default: 'player' },
  teamId: { type: mongoose.Schema.Types.ObjectId, ref: 'Team' },
  labId: { type: mongoose.Schema.Types.ObjectId, ref: 'Lab' }, // For Round 1
  score: { type: Number, default: 0 },
  isDisabled: { type: Boolean, default: false },
  disabledUntil: { type: Date }
});

module.exports = mongoose.model('User', UserSchema);
