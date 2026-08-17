const express = require('express');
const router = express.Router();
const Article = require('../../models/Article');

// GET / — list active articles for a tenant (from query param), sorted by publishedAt desc
router.get('/', async (req, res) => {
  try {
    const { tenantId } = req.query;
    if (!tenantId) {
      return res.status(400).json({ error: 'tenantId is required' });
    }

    const articles = await Article.find({ tenantId, isActive: true })
      .sort({ publishedAt: -1 })
      .lean();
    res.json(articles);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /:slug — get a single active article by slug and tenant
router.get('/:slug', async (req, res) => {
  try {
    console.log('BACKEND GET ARTICLE:', { slug: req.params.slug, queryTenantId: req.query.tenantId });
    const { tenantId } = req.query;
    if (!tenantId) {
      return res.status(400).json({ error: 'tenantId is required' });
    }

    const article = await Article.findOne({
      slug: req.params.slug,
      tenantId,
      isActive: true,
    }).lean();

    console.log('BACKEND DB RESULT:', article);
    if (!article) return res.status(404).json({ error: 'Article not found' });
    res.json(article);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
