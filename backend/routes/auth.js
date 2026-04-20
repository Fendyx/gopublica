const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/user');
const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_key_gopublica';

// РЕГИСТРАЦИЯ
router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    
    // Проверяем, есть ли уже такой email
    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ message: 'Email уже занят' });

    // Шифруем пароль
    const hashedPassword = await bcrypt.hash(password, 10);

    // Создаем юзера (роль 'user' присвоится автоматически)
    const newUser = new User({ name, email, password: hashedPassword });
    await newUser.save();

    res.status(201).json({ message: 'Регистрация успешна! Ожидайте подтверждения прав.' });
  } catch (error) {
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// ЛОГИН
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: 'Пользователь не найден' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: 'Неверный пароль' });

    // Генерируем токен
    const token = jwt.sign({ id: user._id, role: user.role }, JWT_SECRET, { expiresIn: '7d' });

    // Отправляем токен и данные юзера (без пароля)
    res.json({
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role }
    });
  } catch (error) {
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

module.exports = router;