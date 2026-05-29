require('dotenv').config();

const express = require('express');
const cors = require('cors');
const path = require('path');
const connectDB = require('./db');
const startReminderCron = require('./cron/reminderCron');

const app = express();

// Connect Database
connectDB();

// CORS — allow Netlify frontend + localhost development
const allowedOrigins = [
  'https://assignmate-students.netlify.app',
  'http://localhost:5000',
  'http://127.0.0.1:5000'
];
app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(null, true);
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Middleware
app.use(express.json());

// Static folders
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use(express.static(path.join(__dirname, '../frontend')));

// API Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/assignments', require('./routes/assignments'));
app.use('/api/submissions', require('./routes/submissions'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/mentor', require('./routes/mentor'));
app.use('/api/analytics', require('./routes/analytics'));
app.use('/api/leaderboard', require('./routes/leaderboard'));
app.use('/api/announcements', require('./routes/announcements'));

// Health Check Route
app.get('/api', (req, res) => {
  res.json({ message: 'AssignMate API v2.0 ✅' });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('❌', err);
  res.status(500).json({
    message: err.message || 'Internal Server Error'
  });
});

// Start Server
const PORT = process.env.PORT || 5000;

startReminderCron();

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});