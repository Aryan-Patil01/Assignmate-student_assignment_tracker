const express = require('express');
const router = express.Router();
const Submission = require('../models/Submission');
const Assignment = require('../models/Assignment');
const auth = require('../middleware/auth');
const upload = require('../upload');
const path = require('path');

// Student submits assignment with optional file
router.put('/submit/:assignmentId', auth, upload.single('file'), async (req, res) => {
  try {
    const { submittedText } = req.body;
    const assignment = await Assignment.findById(req.params.assignmentId);
    const now = new Date();
    const status = now > assignment.deadline ? 'late' : 'submitted';

    const updateData = {
      submittedText,
      status,
      submittedAt: now
    };

    if (req.file) {
      updateData.fileUrl = req.file.filename;
      updateData.fileName = req.file.originalname;
    }

    const sub = await Submission.findOneAndUpdate(
      { assignmentId: req.params.assignmentId, studentId: req.user.id },
      updateData,
      { new: true }
    );
    res.json({ message: 'Submitted successfully', submission: sub });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get submissions for a student
router.get('/my', auth, async (req, res) => {
  try {
    const subs = await Submission.find({ studentId: req.user.id })
      .populate('assignmentId', 'title subject deadline description');
    res.json(subs);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Teacher/mentor get all submissions for an assignment
router.get('/assignment/:assignmentId', auth, async (req, res) => {
  try {
    const subs = await Submission.find({ assignmentId: req.params.assignmentId })
      .populate('studentId', 'name email');
    res.json(subs);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Mentor gives feedback and grade
router.put('/feedback/:submissionId', auth, async (req, res) => {
  try {
    if (req.user.role !== 'mentor' && req.user.role !== 'teacher') {
      return res.status(403).json({ message: 'Forbidden' });
    }
    const { grade, feedback } = req.body;
    const sub = await Submission.findByIdAndUpdate(
      req.params.submissionId,
      { grade, feedback },
      { new: true }
    );
    res.json({ message: 'Feedback saved', submission: sub });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Download submitted file
router.get('/file/:filename', auth, (req, res) => {
  const filePath = path.join(__dirname, '..', 'uploads', req.params.filename);
  res.download(filePath, (err) => {
    if (err) res.status(404).json({ message: 'File not found' });
  });
});

module.exports = router;