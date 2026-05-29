const mongoose = require('mongoose');

const reminderSchema = new mongoose.Schema({
  assignmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Assignment', required: true },
  studentId:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  sentAt:       { type: Date, default: Date.now }
});

reminderSchema.index({ assignmentId: 1, studentId: 1 }, { unique: true });

module.exports = mongoose.model('Reminder', reminderSchema);
