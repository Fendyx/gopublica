const express = require('express');
const router = express.Router();
const PlatformNews = require('../../models/platform/PlatformNews');
const authTenant = require('../../middleware/auth/tenant');
const auth = require('../../middleware/auth/jwt');

// ─── Tenant-facing: list active published news ─────────────────────────────
router.get('/', authTenant, async (req, res) => {
  try {
    const filter = {
      isActive: true,
      $or: [
        { publishedAt: null },
        { publishedAt: { $lte: new Date() } },
      ],
    };

    const news = await PlatformNews.find(filter).sort({ publishedAt: -1, createdAt: -1 }).lean();
    res.json(news);
  } catch (err) {
    console.error('GET /api/platform/news error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ─── Admin: list all news ──────────────────────────────────────────────────
router.get('/all', auth, async (req, res) => {
  try {
    const { isActive } = req.query;
    const filter = {};

    if (isActive !== undefined) filter.isActive = isActive === 'true';

    const news = await PlatformNews.find(filter).sort({ createdAt: -1 }).lean();
    res.json(news);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Admin: get single news item ───────────────────────────────────────────
router.get('/:id', auth, async (req, res) => {
  try {
    const item = await PlatformNews.findById(req.params.id).lean();
    if (!item) return res.status(404).json({ error: 'News item not found' });
    res.json(item);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Admin: create news ────────────────────────────────────────────────────
router.post('/', auth, async (req, res) => {
  try {
    const { title, titleI18n, content, contentI18n, type, publishedAt } = req.body;

    if (!title || !content) {
      return res.status(400).json({ error: 'Title and content are required' });
    }

    const item = new PlatformNews({
      title,
      titleI18n: titleI18n || {},
      content,
      contentI18n: contentI18n || {},
      type: type || 'info',
      publishedAt: publishedAt ? new Date(publishedAt) : new Date(),
    });

    await item.save();
    res.status(201).json(item);
  } catch (err) {
    console.error('POST /api/platform/news error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ─── Admin: update news ────────────────────────────────────────────────────
router.put('/:id', auth, async (req, res) => {
  try {
    const item = await PlatformNews.findById(req.params.id);
    if (!item) return res.status(404).json({ error: 'News item not found' });

    const allowed = ['title', 'titleI18n', 'content', 'contentI18n', 'type', 'isActive', 'publishedAt'];
    for (const key of allowed) {
      if (req.body[key] !== undefined) {
        item[key] = key === 'publishedAt' && req.body[key] ? new Date(req.body[key]) : req.body[key];
      }
    }

    await item.save();
    res.json(item);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Admin: delete news ────────────────────────────────────────────────────
router.delete('/:id', auth, async (req, res) => {
  try {
    const item = await PlatformNews.findById(req.params.id);
    if (!item) return res.status(404).json({ error: 'News item not found' });

    await PlatformNews.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
