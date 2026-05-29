const express    = require('express');
const router     = express.Router();
const Assignment = require('../models/Assignment');
const Submission = require('../models/Submission');
const User       = require('../models/User');
const auth       = require('../middleware/auth');
const { sendAssignmentEmail } = require('../services/emailService');

// ── CREATE assignment (teacher + mentor)
router.post('/', auth, async (req, res) => {
  try {
    if (!['teacher','mentor','admin'].includes(req.user.role))
      return res.status(403).json({ message: 'Forbidden' });

    const { title, description, subject, class: cls,
            division, deadline, priority, tags, assignedTo } = req.body;

    const assignment = new Assignment({
      title, description, subject,
      class: cls || '', division: division || '',
      deadline, priority: priority || 'medium',
      tags: tags || [],
      createdBy: req.user.id,
      assignedTo
    });
    await assignment.save();

    // Auto-create pending submissions for every assigned student
    for (const studentId of assignedTo) {
      const exists = await Submission.findOne({
        assignmentId: assignment._id, studentId
      });
      if (!exists)
        await new Submission({ assignmentId: assignment._id, studentId, status: 'pending' }).save();
    }
    const assignedStudents = await User.find({ _id: { $in: assignedTo } }).select('name email');
    Promise.allSettled(
      assignedStudents.map(s => sendAssignmentEmail(s, assignment))
    );

    res.json({ message: 'Assignment created', assignment });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── GET all assignments (role-filtered)
router.get('/', auth, async (req, res) => {
  try {
    let assignments;
    if (['teacher','mentor'].includes(req.user.role)) {
      assignments = await Assignment.find({ createdBy: req.user.id })
        .populate('assignedTo', 'name email usn')
        .sort({ createdAt: -1 });
    } else if (req.user.role === 'student') {
      assignments = await Assignment.find({ assignedTo: req.user.id })
        .populate('createdBy', 'name phone')
        .sort({ deadline: 1 });
    } else {
      assignments = await Assignment.find()
        .populate('createdBy', 'name')
        .populate('assignedTo', 'name')
        .sort({ createdAt: -1 });
    }
    res.json(assignments);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── GET single assignment
router.get('/:id', auth, async (req, res) => {
  try {
    const a = await Assignment.findById(req.params.id)
      .populate('createdBy', 'name')
      .populate('assignedTo', 'name email usn');
    if (!a) return res.status(404).json({ message: 'Assignment not found' });
    res.json(a);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── UPDATE assignment (owner or admin)
router.put('/:id', auth, async (req, res) => {
  try {
    const a = await Assignment.findById(req.params.id);
    if (!a) return res.status(404).json({ message: 'Not found' });
    if (String(a.createdBy) !== req.user.id && req.user.role !== 'admin')
      return res.status(403).json({ message: 'Forbidden' });

    const updated = await Assignment.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json({ message: 'Updated', assignment: updated });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── DELETE assignment (owner or admin)
router.delete('/:id', auth, async (req, res) => {
  try {
    const a = await Assignment.findById(req.params.id);
    if (!a) return res.status(404).json({ message: 'Not found' });
    if (String(a.createdBy) !== req.user.id && req.user.role !== 'admin')
      return res.status(403).json({ message: 'Forbidden' });

    await Assignment.findByIdAndDelete(req.params.id);
    await Submission.deleteMany({ assignmentId: req.params.id });
    res.json({ message: 'Assignment deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── GET approved students list (for assign dropdown)
router.get('/meta/students', auth, async (req, res) => {
  try {
    const students = await User.find({ role: 'student', approved: true })
      .select('name email usn class division');
    res.json(students);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;