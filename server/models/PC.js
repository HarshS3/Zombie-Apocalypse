const mongoose = require('mongoose');

const PCSchema = new mongoose.Schema({
  labId: { type: mongoose.Schema.Types.ObjectId, ref: 'Lab', required: true },
  pcNumber: { type: Number, required: true }, // 1-10
  status: { type: String, enum: ['locked', 'pending', 'solved'], default: 'pending' },
  steps: {
    a: { type: Boolean, default: false },
    b: { type: Boolean, default: false },
    c: { type: Boolean, default: false },
    d: { type: Boolean, default: false }
  },
  progress: { type: Number, default: 0 }, // derived from steps (0..4)
  questions: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Question' }], // Array of 4 question IDs
  assignedAlphabet: { type: String } // Letter revealed upon solving
});

module.exports = mongoose.model('PC', PCSchema);
