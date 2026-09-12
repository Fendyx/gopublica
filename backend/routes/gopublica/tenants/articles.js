const express = require('express');
const router = express.Router();
const Article = require('../../../models/content/Article');

/**
 * GET /api/gopublica/tenants/articles?tenantId=&page=&limit=
 */
router.get('/', async (req, res) => {
  try {
    const { tenantId, page = '1', limit = '50' } = req.query;
    if (!tenantId) return res.status(400).json({ error: 'tenantId is required' });

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(200, Math.max(1, parseInt(limit, 10) || 50));
    const skip = (pageNum - 1) * limitNum;

    const [articles, total] = await Promise.all([
      Article.find({ tenantId }).sort({ publishedAt: -1, createdAt: -1 }).skip(skip).limit(limitNum).lean(),
      Article.countDocuments({ tenantId }),
    ]);

    res.json({ articles, total, page: pageNum, limit: limitNum });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/gopublica/tenants/articles/:id?tenantId=
 */
router.get('/:id', async (req, res) => {
  try {
    const { tenantId } = req.query;
    if (!tenantId) return res.status(400).json({ error: 'tenantId is required' });
    const article = await Article.findOne({ _id: req.params.id, tenantId }).lean();
    if (!article) return res.status(404).json({ error: 'Article not found' });
    res.json(article);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * PUT /api/gopublica/tenants/articles/:id?tenantId=
 */
router.put('/:id', async (req, res) => {
  try {
    const { tenantId } = req.query;
    if (!tenantId) return res.status(400).json({ error: 'tenantId is required' });
    const article = await Article.findOneAndUpdate(
      { _id: req.params.id, tenantId },
      req.body,
      { new: true, runValidators: true },
    );
    if (!article) return res.status(404).json({ error: 'Article not found' });
    res.json(article);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * DELETE /api/gopublica/tenants/articles/:id?tenantId=
 */
router.delete('/:id', async (req, res) => {
  try {
    const { tenantId } = req.query;
    if (!tenantId) return res.status(400).json({ error: 'tenantId is required' });
    const article = await Article.findOneAndDelete({ _id: req.params.id, tenantId });
    if (!article) return res.status(404).json({ error: 'Article not found' });
    res.json({ message: 'Article deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
