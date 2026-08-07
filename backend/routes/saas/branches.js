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
    const {
      name, city, address, phone, email, workingHours, coordinates, settingsOverride,
      parentBranchId, venueType,
    } = req.body;

    // Если создаём подфилию — проверяем, что родитель существует и принадлежит тому же тенанту
    if (parentBranchId) {
      const parent = await Branch.findOne({ _id: parentBranchId, tenantId: req.tenantId });
      if (!parent) return res.status(400).json({ error: 'parentBranchId не найден для этого тенанта' });
    }

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
      parentBranchId: parentBranchId || null,
      venueType: venueType || (parentBranchId ? 'concept' : 'main'),
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

    const {
      name, city, address, phone, email, workingHours, coordinates, settingsOverride, isActive,
      parentBranchId, venueType,
    } = req.body;

    if (name !== undefined) branch.name = name;
    if (city !== undefined) branch.city = city;
    if (address !== undefined) branch.address = address;
    if (phone !== undefined) branch.phone = phone;
    if (email !== undefined) branch.email = email;
    if (workingHours !== undefined) branch.workingHours = workingHours;
    if (coordinates !== undefined) branch.coordinates = coordinates;
    if (settingsOverride !== undefined) branch.settingsOverride = settingsOverride;
    if (isActive !== undefined) branch.isActive = isActive;

    if (parentBranchId !== undefined) {
      // запрет самопривязки и привязки к чужому тенанту
      if (parentBranchId && String(parentBranchId) === String(branch._id)) {
        return res.status(400).json({ error: 'Филиал не может быть родителем самому себе' });
      }
      if (parentBranchId) {
        const parent = await Branch.findOne({ _id: parentBranchId, tenantId: req.tenantId });
        if (!parent) return res.status(400).json({ error: 'parentBranchId не найден для этого тенанта' });
      }
      branch.parentBranchId = parentBranchId || null;
    }
    if (venueType !== undefined) branch.venueType = venueType;

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