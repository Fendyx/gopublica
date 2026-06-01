const path     = require('path');
const express  = require('express');
const cors     = require('cors');
const mongoose = require('mongoose');
const fs       = require('fs');
require('dotenv').config();

const app  = express();
const PORT = process.env.PORT || 5000;

// ── Настройки CORS ───────────────────────────────────
// Явно добавляем боевые домены, чтобы не зависеть только от .env
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:5173',
  'https://gopublica.com',
  'https://www.gopublica.com',
  process.env.FRONTEND_URL,
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // Если origin нет (например, прямые запросы) или он в списке разрешенных
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      // ВАЖНО: Возвращаем false вместо new Error(). 
      // Это предотвращает краш запроса и появление 500 ошибки с HTML!
      callback(null, false);
    }
  },
  credentials: true,
}));

app.use('/api/stripe/webhook', require('./routes/stripe/webhook')); // важно: перед express.json() для вебхуков

app.use(express.json());

// ── База данных ──────────────────────────────────────
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('✅ MongoDB connected'))
  .catch(err => console.error('❌ DB error:', err));

// ── API Роуты ────────────────────────────────────────
app.use('/api/auth',            require('./routes/auth'));
app.use('/api/leads',           require('./routes/leads'));
app.use('/api/users',           require('./routes/users'));      
app.use('/api/clients',         require('./routes/clients'));
app.use('/api/subscriptions',   require('./routes/subscriptions'));
app.use('/api/change-requests', require('./routes/changeRequests'));
app.use('/api/portfolio',       require('./routes/portfolio'));
app.use('/api/projects',        require('./routes/projects'));
app.use('/api/saas/menu',       require('./routes/saas/menu'));
app.use('/api/saas/auth',       require('./routes/saas/auth'));
app.use('/api/saas/reservations', require('./routes/saas/reservations'));
app.use('/api/saas/settings',   require('./routes/saas/settings'));
app.use('/api/saas/gallery',    require('./routes/saas/gallery'));
app.use('/api/saas/dashboard',  require('./routes/saas/dashboard'));
app.use('/api/saas/news',       require('./routes/saas/news'));
app.use('/api/saas/categories', require('./routes/saas/categories'));
app.use('/api/stripe/checkout', require('./routes/stripe/checkout'));
app.use('/api/stripe', require('./routes/stripe/setupIntent'));
app.use('/api/stripe', require('./routes/stripe/subscribe'));


// ── Раздача Фронтенда (прод) ─────────────────────────
const frontendDistPath = path.join(__dirname, '../frontend/dist');

// Проверяем, существует ли папка при запуске сервера
if (!fs.existsSync(frontendDistPath)) {
  console.error(`\n❌ ВНИМАНИЕ: Папка ${frontendDistPath} НЕ НАЙДЕНА!`);
  console.error('❌ Скорее всего, поле "Root Directory" в Render не пустое!\n');
} else {
  console.log(`\n✅ Папка с фронтендом успешно найдена: ${frontendDistPath}\n`);
}

// Раздаем статику (CSS, JS, картинки)
app.use(express.static(frontendDistPath));

// Для всех остальных запросов (роутинг React) отдаем index.html
app.get(/.*/, (req, res) => {
  const indexPath = path.join(frontendDistPath, 'index.html');
  if (!fs.existsSync(indexPath)) {
    return res.status(500).send('Frontend build not found on server');
  }
  res.sendFile(indexPath);
});

// ── Запуск сервера ───────────────────────────────────
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));