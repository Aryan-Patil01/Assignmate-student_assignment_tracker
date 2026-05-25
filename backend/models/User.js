const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name:        { type: String, required: true },
  email:       { type: String, required: true, unique: true },
  password:    { type: String, required: true },
  role:        { type: String, enum: ['admin','teacher','mentor','student'], required: true },
  approved:    { type: Boolean, default: false },
  usn:         { type: String, default: '' },
  class:       { type: String, default: '' },
  division:    { type: String, default: '' },
  subject:     { type: String, default: '' },
  phone:       { type: String, default: '' },
  parentPhone: { type: String, default: '' },
  isMentor:    { type: Boolean, default: false },
  mentorId:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  flagged:     { type: Boolean, default: false },
  flagReason:  { type: String, default: '' },
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);