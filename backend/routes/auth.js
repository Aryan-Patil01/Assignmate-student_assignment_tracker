const express = require('express');
const router  = express.Router();
const bcrypt  = require('bcryptjs');
const jwt     = require('jsonwebtoken');
const User    = require('../models/User');
const auth    = require('../middleware/auth');

// Register
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, role,
            usn, class: cls, division, subject,
            phone, parentPhone } = req.body;

    if (!name || !email || !password || !role)
      return res.status(400).json({ message: 'Name, email, password and role are required' });

    const existing = await User.findOne({ email });
    if (existing)
      return res.status(400).json({ message: 'Email already registered' });

    const hashed = await bcrypt.hash(password, 10);
    const user = new User({
      name, email, password: hashed, role,
      approved: false,
      usn:         usn         || '',
      class:       cls         || '',
      division:    division    || '',
      subject:     subject     || '',
      phone:       phone       || '',
      parentPhone: parentPhone || '',
    });
    await user.save();
    res.json({ message: 'Registered successfully. Wait for admin approval.' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user)
      return res.status(400).json({ message: 'User not found' });
    if (!user.approved)
      return res.status(403).json({ message: 'Account not approved yet. Contact your admin.' });

    const match = await bcrypt.compare(password, user.password);
    if (!match)
      return res.status(400).json({ message: 'Wrong password' });

    const token = jwt.sign(
      { id: user._id, role: user.role, name: user.name, isMentor: user.isMentor },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    res.json({
      token,
      role:     user.role,
      name:     user.name,
      id:       user._id,
      isMentor: user.isMentor
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get current user profile
router.get('/me', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .select('-password')
      .populate('mentorId', 'name email');
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;