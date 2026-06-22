const express = require('express');
const router = express.Router();
const CustomerUser = require('../../models/CustomerUser');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Роут: POST /api/public/auth/register
router.post('/register', async (req, res) => {
  try {
    const { name, email, phone, password, tenantId } = req.body;

    // Проверяем, есть ли tenantId (откуда пришел пользователь)
    // Если его нет в body, можно попытаться взять из хедера (X-Tenant-ID), 
    // но лучше передавать явно с фронта.
    const finalTenantId = tenantId || req.headers['x-tenant-id'];

    if (!finalTenantId) {
      return res.status(400).json({ error: 'Tenant ID is required' });
    }

    // Проверяем, не зарегистрирован ли уже такой email в рамках этого тенанта
    const existingUser = await CustomerUser.findOne({ email, tenantId: finalTenantId });
    if (existingUser) {
      return res.status(400).json({ error: 'User with this email already exists' });
    }

    // Создаем нового пользователя
    const passwordHash = await bcrypt.hash(password, 10);
    const newUser = new CustomerUser({
      name,
      email,
      phone,
      passwordHash,
      tenantId: finalTenantId,
    });

    await newUser.save();

    // Генерируем токен для автологина после регистрации
    const token = jwt.sign(
      { userId: newUser._id, role: 'customer', tenantId: finalTenantId },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({ token, user: { id: newUser._id, name, email, phone } });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ error: 'Server error during registration' });
  }
});

// Роут: POST /api/public/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password, tenantId } = req.body;
    const finalTenantId = tenantId || req.headers['x-tenant-id'];

    if (!finalTenantId) {
      return res.status(400).json({ error: 'Tenant ID is required' });
    }

    // Ищем пользователя по email и tenantId
    const user = await CustomerUser.findOne({ email, tenantId: finalTenantId });
    if (!user) {
      return res.status(400).json({ error: 'Invalid email or password' });
    }

    // Проверяем пароль (используем метод модели или bcrypt напрямую)
    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(400).json({ error: 'Invalid email or password' });
    }

    // Генерируем токен
    const token = jwt.sign(
      { userId: user._id, role: 'customer', tenantId: finalTenantId },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({ token, user: { id: user._id, name: user.name, email: user.email, phone: user.phone } });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Server error during login' });
  }
});

module.exports = router;