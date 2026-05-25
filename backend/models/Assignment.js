const mongoose = require('mongoose');

const assignmentSchema = new mongoose.Schema({
  title:       { type: String, required: true },
  description: { type: String, default: '' },
  subject:     { type: String, required: true },
  class:       { type: String, default: '' },
  division:    { type: String, default: '' },
  deadline:    { type: Date, required: true },
  priority:    { type: String, enum: ['low','medium','high'], default: 'medium' },
  tags:        [{ type: String }],
  createdBy:   { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  assignedTo:  [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
}, { timestamps: true });

module.exports = mongoose.model('Assignment', assignmentSchema);