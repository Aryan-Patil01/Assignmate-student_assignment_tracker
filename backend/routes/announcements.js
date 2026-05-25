const express      = require('express');
const router       = express.Router();
const Announcement = require('../models/Announcement');
const auth         = require('../middleware/auth');

// Create announcement (teacher, mentor, admin)
router.post('/', auth, async (req, res) => {
  try {
    if (!['teacher','mentor','admin'].includes(req.user.role))
      return res.status(403).json({ message: 'Forbidden' });

    const { title, message, targetRole, pinned } = req.body;
    const ann = new Announcement({
      title, message,
      postedBy:   req.user.id,
      targetRole: targetRole || 'all',
      pinned:     pinned || false
    });
    await ann.save();
    res.json({ message: 'Announcement posted', announcement: ann });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// Get announcements (filtered by role)
router.get('/', auth, async (req, res) => {
  try {
    const filter = {
      $or: [{ targetRole: 'all' }, { targetRole: req.user.role }]
    };
    const announcements = await Announcement.find(filter)
      .populate('postedBy', 'name role')
      .sort({ pinned: -1, createdAt: -1 });
    res.json(announcements);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// Delete announcement (poster or admin)
router.delete('/:id', auth, async (req, res) => {
  try {
    const ann = await Announcement.findById(req.params.id);
    if (!ann) return res.status(404).json({ message: 'Not found' });
    if (String(ann.postedBy) !== req.user.id && req.user.role !== 'admin')
      return res.status(403).json({ message: 'Forbidden' });
    await Announcement.findByIdAndDelete(req.params.id);
    res.json({ message: 'Deleted' });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// Pin / unpin announcement (admin only)
router.put('/pin/:id', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin')
      return res.status(403).json({ message: 'Admin only' });
    const ann = await Announcement.findByIdAndUpdate(
      req.params.id, { pinned: req.body.pinned }, { new: true }
    );
    res.json({ message: 'Updated', announcement: ann });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

module.exports = router;