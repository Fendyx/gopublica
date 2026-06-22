const express = require('express');
const router = express.Router();
const Order = require('../../models/Order');
const CustomerUser = require('../../models/CustomerUser');
const jwt = require('jsonwebtoken');

// Middleware для проверки токена КЛИЕНТА
const authCustomer = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Проверяем, что роль customer (опционально, для безопасности)
    if (decoded.role !== 'customer') {
       return res.status(403).json({ error: 'Forbidden' });
    }

    // Находим юзера, чтобы убедиться, что он существует
    const user = await CustomerUser.findById(decoded.userId);
    if (!user) return res.status(401).json({ error: 'User not found' });

    req.customerUserId = decoded.userId;
    req.tenantId = decoded.tenantId;
    next();
  } catch (err) {
    res.status(401).json({ error: 'Invalid token' });
  }
};

// Получить мои заказы
router.get('/', authCustomer, async (req, res) => {
  try {
    const orders = await Order.find({
      tenantId: req.tenantId,
      customerUserId: req.customerUserId
    }).sort({ createdAt: -1 });

    res.json(orders);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;