const mongoose = require('mongoose');

const QuestionSchema = new mongoose.Schema({
  content: { type: String, required: true },
  difficulty: { type: String, enum: ['easy', 'medium', 'hard'], required: true },
  answer: { type: String, required: true },
  points: { type: Number, default: 10 },
  category: { type: String, default: 'general' } // dsa, logic, aptitude
});

module.exports = mongoose.model('Question', QuestionSchema);
