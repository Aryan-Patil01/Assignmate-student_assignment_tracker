const mongoose = require('mongoose');

const submissionSchema = new mongoose.Schema({
  assignmentId:  { type: mongoose.Schema.Types.ObjectId, ref: 'Assignment', required: true },
  studentId:     { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  submittedText: { type: String, default: '' },
  fileUrl:       { type: String, default: '' },
  fileName:      { type: String, default: '' },
  status:        { type: String, enum: ['pending','submitted','late','evaluated'], default: 'pending' },
  marks:         { type: Number, default: null },
  maxMarks:      { type: Number, default: 100 },
  feedback:      { type: String, default: '' },
  submittedAt:   { type: Date },
}, { timestamps: true });

module.exports = mongoose.model('Submission', submissionSchema);