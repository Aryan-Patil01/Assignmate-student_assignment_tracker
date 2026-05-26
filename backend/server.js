require('dotenv').config();
const express = require('express');
const cors    = require('cors');
const path    = require('path');
const connectDB = require('./db');

const app = express();
connectDB();

app.use(cors({
  origin: [
    'http://localhost:5500',
    'http://127.0.0.1:5500',
    'https://assignmate-students.netlify.app'
  ]
}));
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use(express.static(path.join(__dirname, '../frontend')));

// ── Routes
app.use('/api/auth',          require('./routes/auth'));
app.use('/api/assignments',   require('./routes/assignments'));
app.use('/api/submissions',   require('./routes/submissions'));
app.use('/api/admin',         require('./routes/admin'));
app.use('/api/mentor',        require('./routes/mentor'));
app.use('/api/analytics',     require('./routes/analytics'));
app.use('/api/leaderboard',   require('./routes/leaderboard'));
app.use('/api/announcements', require('./routes/announcements'));

app.get('/api', (req, res) => res.json({ message: 'AssignMate API v2.0 ✅' }));

// Global error handler
app.use((err, req, res, next) => {
  console.error('❌', err.message);
  res.status(500).json({ message: err.message || 'Internal server error' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));