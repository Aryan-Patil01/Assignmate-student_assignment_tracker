const express    = require('express');
const router     = express.Router();
const Assignment = require('../models/Assignment');
const Submission = require('../models/Submission');
const User       = require('../models/User');
const auth       = require('../middleware/auth');

// Analytics for a specific assignment (teacher/mentor)
router.get('/assignment/:assignmentId', auth, async (req, res) => {
  try {
    const subs = await Submission.find({ assignmentId: req.params.assignmentId })
      .populate('studentId', 'name usn');

    const total     = subs.length;
    const submitted = subs.filter(s => s.status === 'submitted').length;
    const late      = subs.filter(s => s.status === 'late').length;
    const evaluated = subs.filter(s => s.status === 'evaluated').length;
    const pending   = subs.filter(s => s.status === 'pending').length;

    const marksData = subs
      .filter(s => s.status === 'evaluated' && s.marks !== null)
      .map(s => ({
        name:     s.studentId?.name || 'Unknown',
        marks:    s.marks,
        maxMarks: s.maxMarks
      }));

    res.json({ total, submitted, late, evaluated, pending, marksData });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Overall analytics for teacher (all their assignments)
router.get('/teacher', auth, async (req, res) => {
  try {
    if (!['teacher','mentor','admin'].includes(req.user.role))
      return res.status(403).json({ message: 'Forbidden' });

    const assignments = await Assignment.find({ createdBy: req.user.id });
    const result = [];

    for (const a of assignments) {
      const subs      = await Submission.find({ assignmentId: a._id });
      const total     = subs.length;
      const submitted = subs.filter(s =>
        ['submitted','late','evaluated'].includes(s.status)).length;
      const pending   = subs.filter(s => s.status === 'pending').length;

      result.push({
        assignmentId: a._id,
        title:        a.title,
        subject:      a.subject,
        deadline:     a.deadline,
        total,
        submitted,
        pending
      });
    }
    res.json(result);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Submission timeline for an assignment
router.get('/timeline/:assignmentId', auth, async (req, res) => {
  try {
    const subs = await Submission.find({
      assignmentId: req.params.assignmentId,
      submittedAt: { $ne: null }
    }).populate('studentId', 'name').sort({ submittedAt: 1 });

    const assignment = await Assignment.findById(req.params.assignmentId);

    const timeline = subs.map(s => ({
      student:     s.studentId?.name || 'Unknown',
      submittedAt: s.submittedAt,
      status:      s.status,
      isLate:      s.submittedAt > assignment.deadline
    }));

    res.json(timeline);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;