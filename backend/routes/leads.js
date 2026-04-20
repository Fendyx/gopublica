const express = require('express');
const router = express.Router();
const Lead = require('../models/lead');

// ИМПОРТИРУЕМ ОХРАННИКОВ (Middleware)
const auth = require('../middleware/auth');
const checkRole = require('../middleware/checkRole');

// GET: Получить все лиды (для вывода в Дашборде)
router.get('/', auth, checkRole(['admin', 'superadmin']), async (req, res) => {
  try {
    const leads = await Lead.find().sort({ createdAt: -1 }); // Сортируем: новые сверху
    res.json(leads);
  } catch (error) {
    res.status(500).json({ message: 'Ошибка сервера при получении лидов', error });
  }
});

// POST: Создать новый лид
router.post('/', auth, checkRole(['admin', 'superadmin']), async (req, res) => {
  try {
    const newLead = new Lead(req.body);
    const savedLead = await newLead.save();
    res.status(201).json(savedLead);
  } catch (error) {
    res.status(400).json({ message: 'Ошибка при создании лида', error });
  }
});

// PUT: Обновить статус лида
router.put('/:id', auth, checkRole(['admin', 'superadmin']), async (req, res) => {
  try {
    const updatedLead = await Lead.findByIdAndUpdate(
      req.params.id, 
      { status: req.body.status },
      { new: true }
    );
    res.json(updatedLead);
  } catch (error) {
    res.status(400).json({ message: 'Ошибка при обновлении лида', error });
  }
});

// DELETE: Удалить лида
router.delete('/:id', auth, checkRole(['admin', 'superadmin']), async (req, res) => {
  try {
    await Lead.findByIdAndDelete(req.params.id);
    res.json({ message: 'Лид успешно удален' });
  } catch (error) {
    res.status(500).json({ message: 'Ошибка при удалении лида', error });
  }
});

module.exports = router;