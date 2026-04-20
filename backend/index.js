//backend/index.js
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

// Запуск сервера
app.listen(PORT, () => {
  console.log(`🚀 Сервер запущен на http://localhost:${PORT}`);
});