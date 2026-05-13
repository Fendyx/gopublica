const path    = require('path');
const express = require('express');
const cors    = require('cors');
const mongoose = require('mongoose');
require('dotenv').config();

const app  = express();
const PORT = process.env.PORT || 5000;

const allowedOrigins = [
  'http://localhost:5173',
  process.env.FRONTEND_URL,
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) callback(null, true);
    else callback(new Error(`CORS: origin ${origin} not allowed`));
  },
  credentials: true,
}));

app.use(express.json());

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('✅ MongoDB connected'))
  .catch(err => console.error('❌ DB error:', err));

// ── Роуты ────────────────────────────────────────────
app.use('/api/auth',            require('./routes/auth'));
app.use('/api/leads',           require('./routes/leads'));
app.use('/api/users',           require('./routes/users'));      
app.use('/api/clients',         require('./routes/clients'));
app.use('/api/subscriptions',   require('./routes/subscriptions'));
app.use('/api/change-requests', require('./routes/changeRequests'));
app.use('/api/portfolio',       require('./routes/portfolio'));
app.use('/api/projects',        require('./routes/projects'));

// ── Фронтенд (прод) ──────────────────────────────────
app.use(express.static(path.join(__dirname, '../frontend/dist')));

// В Express 5+ вместо '*' используем регулярное выражение /.*/
app.get(/.*/, (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/dist/index.html'));
});

app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));