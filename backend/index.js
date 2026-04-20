//backend/index.js
const path = require('path');
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Подключение к MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('✅ Успешно подключились к MongoDB'))
  .catch((err) => console.error('❌ Ошибка подключения к БД:', err));

// Подключаем роуты (мы создадим их в следующем шаге)
app.use('/api/leads', require('./routes/leads'));
app.use('/api/auth', require('./routes/auth'));

// 1. Указываем Express, где лежат собранные файлы фронтенда
app.use(express.static(path.join(__dirname, '../frontend/dist')));

// 2. Любой запрос, который не попал в /api, перенаправляем на index.html фронтенда.
// Используем app.use вместо app.get('*'), чтобы избежать ошибки в Express 5+
app.use((req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/dist/index.html'));
});


// Запуск сервера
app.listen(PORT, () => {
  console.log(`🚀 Сервер запущен на http://localhost:${PORT}`);
});