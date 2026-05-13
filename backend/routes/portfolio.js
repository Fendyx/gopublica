const express = require('express');
const router = express.Router();
const PortfolioCase = require('../models/portfolioCase');
const auth = require('../middleware/auth');
const checkRole = require('../middleware/checkRole');

console.log('📦 Portfolio routes loaded');

// === ADMIN CRUD (должно быть ВЫШЕ динамических роутов!) ===

router.get('/admin', auth, checkRole('admin', 'superadmin'), async (req, res) => {
  try {
    const cases = await PortfolioCase.find().sort({ createdAt: -1 });
    res.json(cases);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/admin', auth, checkRole('admin', 'superadmin'), async (req, res) => {
  try {
    const newCase = await PortfolioCase.create({ 
      ...req.body, 
      slug: req.body.slug || req.body.title.toLowerCase().replace(/[^a-z0-9]+/g, '-') 
    });
    res.status(201).json(newCase);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.put('/admin/:id', auth, checkRole('admin', 'superadmin'), async (req, res) => {
  try {
    const updated = await PortfolioCase.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!updated) return res.status(404).json({ error: 'Not found' });
    res.json(updated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.delete('/admin/:id', auth, checkRole('admin', 'superadmin'), async (req, res) => {
  try {
    await PortfolioCase.findByIdAndDelete(req.params.id);
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// === PUBLIC ROUTES (после админских) ===

router.get('/', async (req, res) => {
  try {
    const cases = await PortfolioCase.find({ isPublished: true })
      .sort({ sortOrder: 1, createdAt: -1 });
    res.json(cases);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Динамический роут — всегда в конце
router.get('/:slug', async (req, res) => {
  try {
    const caseItem = await PortfolioCase.findOne({ slug: req.params.slug, isPublished: true });
    if (!caseItem) return res.status(404).json({ error: 'Not found' });
    res.json(caseItem);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;