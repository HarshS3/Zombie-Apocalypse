const mongoose = require('mongoose');

const LabSchema = new mongoose.Schema({
  labNumber: { type: Number, required: true, unique: true, min: 1, max: 8 },
  name: { type: String, required: true }, // e.g., "Lab A"
  isCompleted: { type: Boolean, default: false }, // Round 1 Escape status
  infectionLevel: { type: String, enum: ['low', 'medium', 'critical'], default: 'low' },
  qualifyStatus: { type: Boolean, default: false }, // Round 1 qualification
  totalSolvedPCs: { type: Number, default: 0 },
  assignedAlphabets: [String], // The jumbled letters
  correctWord: String
});

module.exports = mongoose.model('Lab', LabSchema);
