const express    = require('express');
const router     = express.Router();
const Submission = require('../models/Submission');
const Assignment = require('../models/Assignment');
const auth       = require('../middleware/auth');
const upload     = require('../upload');
const path       = require('path');
const fs         = require('fs');

// ── SUBMIT assignment (student)
router.put('/submit/:assignmentId', auth, upload.single('file'), async (req, res) => {
  try {
    const { submittedText } = req.body;
    const assignment = await Assignment.findById(req.params.assignmentId);
    if (!assignment) return res.status(404).json({ message: 'Assignment not found' });

    const now    = new Date();
    const status = now > assignment.deadline ? 'late' : 'submitted';
    const update = { submittedText, status, submittedAt: now };

    if (req.file) {
      update.fileUrl  = req.file.filename;
      update.fileName = req.file.originalname;
    }

    const sub = await Submission.findOneAndUpdate(
      { assignmentId: req.params.assignmentId, studentId: req.user.id },
      update,
      { new: true, upsert: true }
    );
    res.json({
      message: status === 'late' ? 'Submitted (late)' : 'Submitted successfully',
      submission: sub
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── GET my submissions (student)
router.get('/my', auth, async (req, res) => {
  try {
    const subs = await Submission.find({ studentId: req.user.id })
      .populate('assignmentId', 'title subject deadline description priority');
    res.json(subs);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── GET all submissions for an assignment (teacher/mentor)
router.get('/assignment/:assignmentId', auth, async (req, res) => {
  try {
    const subs = await Submission.find({ assignmentId: req.params.assignmentId })
      .populate('studentId', 'name email usn class division parentPhone');
    res.json(subs);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── EVALUATE submission — marks + feedback (teacher/mentor)
router.put('/evaluate/:submissionId', auth, async (req, res) => {
  try {
    if (!['mentor','teacher','admin'].includes(req.user.role))
      return res.status(403).json({ message: 'Forbidden' });

    const { marks, maxMarks, feedback } = req.body;
    const sub = await Submission.findByIdAndUpdate(
      req.params.submissionId,
      { marks, maxMarks: maxMarks || 100, feedback, status: 'evaluated' },
      { new: true }
    );
    res.json({ message: 'Evaluation saved', submission: sub });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── PREVIEW file in browser
router.get('/file/:filename', auth, (req, res) => {
  const filePath = path.join(__dirname, '..', 'uploads', req.params.filename);
  if (!fs.existsSync(filePath))
    return res.status(404).json({ message: 'File not found' });
  res.sendFile(filePath);
});

// ── DOWNLOAD file as attachment
router.get('/download/:filename', auth, (req, res) => {
  const filePath = path.join(__dirname, '..', 'uploads', req.params.filename);
  if (!fs.existsSync(filePath))
    return res.status(404).json({ message: 'File not found' });
  res.download(filePath);
});

module.exports = router;