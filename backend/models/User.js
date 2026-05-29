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
  phone: {
    type: String,
    default: '',
    validate: {
      validator: function (v) {
        if (!v) return true;
        const digits = v.replace(/\D/g, '');
        const normalized = digits.length === 12 && digits.startsWith('91') ? digits.slice(2) : digits;
        return /^[0-9]{10}$/.test(normalized);
      },
      message: 'Phone must be a valid 10-digit Indian mobile number',
    },
  },
  parentPhone: {
    type: String,
    default: '',
    validate: {
      validator: function (v) {
        if (!v) return true;
        const digits = v.replace(/\D/g, '');
        const normalized = digits.length === 12 && digits.startsWith('91') ? digits.slice(2) : digits;
        return /^[0-9]{10}$/.test(normalized);
      },
      message: 'Parent phone must be a valid 10-digit Indian mobile number',
    },
  },
  isMentor:    { type: Boolean, default: false },
  mentorId:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  flagged:     { type: Boolean, default: false },
  flagReason:  { type: String, default: '' },
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);