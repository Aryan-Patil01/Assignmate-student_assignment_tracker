const express = require('express');
const router = express.Router();
const Assignment = require('../models/Assignment');
const Submission = require('../models/Submission');
const User = require('../models/User');
const auth = require('../middleware/auth');

// Create assignment (teacher only)
router.post('/', auth, async (req, res) => {
  try {
    if (req.user.role !== 'teacher') return res.status(403).json({ message: 'Forbidden' });
    const { title, description, subject, deadline, assignedTo } = req.body;
    const assignment = new Assignment({
      title, description, subject, deadline,
      createdBy: req.user.id,
      assignedTo
    });
    await assignment.save();

    // Create pending submissions for each student
    for (const studentId of assignedTo) {
      const sub = new Submission({ assignmentId: assignment._id, studentId, status: 'pending' });
      await sub.save();
    }
    res.json({ message: 'Assignment created', assignment });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get all assignments (teacher sees own, student sees assigned)
router.get('/', auth, async (req, res) => {
  try {
    let assignments;
    if (req.user.role === 'teacher') {
      assignments = await Assignment.find({ createdBy: req.user.id }).populate('assignedTo', 'name email');
    } else if (req.user.role === 'student') {
      assignments = await Assignment.find({ assignedTo: req.user.id }).populate('createdBy', 'name');
    } else {
      assignments = await Assignment.find().populate('createdBy', 'name').populate('assignedTo', 'name');
    }
    res.json(assignments);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get students list (for teacher to assign)
router.get('/students', auth, async (req, res) => {
  try {
    const students = await User.find({ role: 'student', approved: true }).select('name email');
    res.json(students);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;