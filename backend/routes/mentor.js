const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Submission = require('../models/Submission');
const auth = require('../middleware/auth');

// Get students assigned to this mentor
router.get('/students', auth, async (req, res) => {
  try {
    if (req.user.role !== 'mentor') return res.status(403).json({ message: 'Forbidden' });
    const students = await User.find({ mentorId: req.user.id, role: 'student' }).select('name email');
    res.json(students);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Assign mentor to student (admin only)
router.put('/assign', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ message: 'Forbidden' });
    const { studentId, mentorId } = req.body;
    await User.findByIdAndUpdate(studentId, { mentorId });
    res.json({ message: 'Mentor assigned' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;