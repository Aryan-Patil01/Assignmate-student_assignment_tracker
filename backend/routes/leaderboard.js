const express    = require('express');
const router     = express.Router();
const Submission = require('../models/Submission');
const User       = require('../models/User');
const auth       = require('../middleware/auth');

// Get leaderboard (top students by average marks + submission rate)
router.get('/', auth, async (req, res) => {
  try {
    const students = await User.find({ role: 'student', approved: true }).select('name email usn class division');

    const leaderboard = [];

    for (const student of students) {
      const subs      = await Submission.find({ studentId: student._id });
      const total     = subs.length;
      if (total === 0) continue;

      const submitted    = subs.filter(s => ['submitted','late','evaluated'].includes(s.status)).length;
      const onTime       = subs.filter(s => s.status === 'submitted').length;
      const evaluated    = subs.filter(s => s.status === 'evaluated' && s.marks !== null);
      const avgMarks     = evaluated.length
        ? Math.round(evaluated.reduce((sum, s) => sum + s.marks, 0) / evaluated.length)
        : 0;
      const submitRate   = Math.round((submitted / total) * 100);

      // Score = 60% avg marks + 40% submission rate
      const score = Math.round((avgMarks * 0.6) + (submitRate * 0.4));

      leaderboard.push({
        student:     { id: student._id, name: student.name, usn: student.usn, class: student.class },
        avgMarks,
        submitRate,
        onTime,
        total,
        submitted,
        score
      });
    }

    // Sort by score descending
    leaderboard.sort((a, b) => b.score - a.score);

    // Add rank
    leaderboard.forEach((entry, i) => { entry.rank = i + 1; });

    res.json(leaderboard);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

module.exports = router;