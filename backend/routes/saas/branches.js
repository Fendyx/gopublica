const express = require('express');
const router = express.Router();
const Branch = require('../../models/Branch');
const authTenant = require('../../middleware/authTenant');

// Получить все филиалы тенанта
router.get('/', authTenant, async (req, res) => {
  try {
    const branches = await Branch.find({ tenantId: req.tenantId, isActive: true }).sort({ city: 1, name: 1 });
    res.json(branches);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Создать новый филиал
router.post('/', authTenant, async (req, res) => {
  try {
    const { name, city, address, phone, email, workingHours, coordinates, settingsOverride } = req.body;
    const branch = new Branch({
      tenantId: req.tenantId,
      name,
      city,
      address,
      phone,
      email,
      workingHours,
      coordinates,
      settingsOverride,
    });
    await branch.save();
    res.status(201).json(branch);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Публичный роут (без авторизации) – для клиентского сайта
router.get('/public/:tenantId', async (req, res) => {
  try {
    const { tenantId } = req.params;
    const branches = await Branch.find({ tenantId, isActive: true }).sort({ city: 1, name: 1 });
    res.json(branches);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Получить один филиал
router.get('/:id', authTenant, async (req, res) => {
  try {
    const branch = await Branch.findOne({ _id: req.params.id, tenantId: req.tenantId });
    if (!branch) return res.status(404).json({ error: 'Филиал не найден' });
    res.json(branch);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Обновить филиал
router.put('/:id', authTenant, async (req, res) => {
  try {
    const branch = await Branch.findOne({ _id: req.params.id, tenantId: req.tenantId });
    if (!branch) return res.status(404).json({ error: 'Филиал не найден' });

    const { name, city, address, phone, email, workingHours, coordinates, settingsOverride, isActive } = req.body;
    if (name !== undefined) branch.name = name;
    if (city !== undefined) branch.city = city;
    if (address !== undefined) branch.address = address;
    if (phone !== undefined) branch.phone = phone;
    if (email !== undefined) branch.email = email;
    if (workingHours !== undefined) branch.workingHours = workingHours;
    if (coordinates !== undefined) branch.coordinates = coordinates;
    if (settingsOverride !== undefined) branch.settingsOverride = settingsOverride;
    if (isActive !== undefined) branch.isActive = isActive;

    await branch.save();
    res.json(branch);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Удалить филиал (soft-delete)
router.delete('/:id', authTenant, async (req, res) => {
  try {
    const branch = await Branch.findOne({ _id: req.params.id, tenantId: req.tenantId });
    if (!branch) return res.status(404).json({ error: 'Филиал не найден' });
    branch.isActive = false;
    await branch.save();
    res.json({ message: 'Филиал деактивирован' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;