const express = require('express');
const router = express.Router();
const CustomerUser = require('../../models/CustomerUser');
const Order = require('../../models/Order');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Middleware (создавали его ранее)
const authCustomer = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    if (decoded.role !== 'customer') {
       return res.status(403).json({ error: 'Forbidden' });
    }

    const user = await CustomerUser.findById(decoded.userId);
    if (!user) return res.status(401).json({ error: 'User not found' });

    req.customerUserId = decoded.userId;
    req.tenantId = decoded.tenantId;
    next();
  } catch (err) {
    res.status(401).json({ error: 'Invalid token' });
  }
};

// 1. Получить данные профиля
router.get('/', authCustomer, async (req, res) => {
  try {
    const user = await CustomerUser.findById(req.customerUserId).select('-passwordHash');
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 2. Обновить данные (Имя, Телефон, Пароль)
router.put('/', authCustomer, async (req, res) => {
  try {
    const { name, phone, currentPassword, newPassword } = req.body;
    const user = await CustomerUser.findById(req.customerUserId);
    if (!user) return res.status(404).json({ error: 'User not found' });

    // Обновляем имя и телефон
    if (name) user.name = name;
    if (phone) user.phone = phone;

    // Если меняют пароль
    if (newPassword) {
      if (!currentPassword) {
        return res.status(400).json({ error: 'Требуется текущий пароль для смены пароля' });
      }
      const isMatch = await user.comparePassword(currentPassword);
      if (!isMatch) {
        return res.status(400).json({ error: 'Неверный текущий пароль' });
      }
      if (newPassword.length < 6) {
        return res.status(400).json({ error: 'Новый пароль минимум 6 символов' });
      }
      user.passwordHash = await bcrypt.hash(newPassword, 10);
    }

    await user.save();
    // Возвращаем обновленные данные без пароля
    const updatedUser = await CustomerUser.findById(req.customerUserId).select('-passwordHash');
    res.json(updatedUser);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 3. Удалить аккаунт
router.delete('/', authCustomer, async (req, res) => {
  try {
    const user = await CustomerUser.findById(req.customerUserId);
    if (!user) return res.status(404).json({ error: 'User not found' });

    // Удаляем юзера
    await CustomerUser.findByIdAndDelete(req.customerUserId);

    // Опционально: Можно отвязать заказы от пользователя, но оставить историю в CRM
    // await Order.updateMany({ customerUserId: req.customerUserId }, { $unset: { customerUserId: 1 } });

    res.json({ message: 'Аккаунт успешно удален' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;