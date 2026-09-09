const express = require('express');
const router = express.Router();
const GoPublicaNews = require('../../models/platform/GoPublicaNews');
const auth = require('../../middleware/auth/jwt');

// ─── Slug helper ───────────────────────────────────────────────────────────
function generateSlug(title) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

// ─── Public: list active published news ────────────────────────────────────
router.get('/', async (req, res) => {
  try {
    const { category, page = 1, limit = 12 } = req.query;
    const filter = {
      isActive: true,
      $or: [{ publishedAt: null }, { publishedAt: { $lte: new Date() } }],
    };
    if (category) filter.category = category;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [items, total] = await Promise.all([
      GoPublicaNews.find(filter)
        .sort({ publishedAt: -1, createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      GoPublicaNews.countDocuments(filter),
    ]);

    res.json({ items, total, page: parseInt(page), limit: parseInt(limit) });
  } catch (err) {
    console.error('GET /api/platform/site-news error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ─── Public: pinned news for homepage ──────────────────────────────────────
router.get('/pinned', async (_req, res) => {
  try {
    const items = await GoPublicaNews.find({
      isPinned: true,
      isActive: true,
      $or: [{ publishedAt: null }, { publishedAt: { $lte: new Date() } }],
    })
      .sort({ pinnedOrder: 1, publishedAt: -1 })
      .lean();

    // If no pinned items, fallback to latest 3
    if (items.length === 0) {
      const fallback = await GoPublicaNews.find({
        isActive: true,
        $or: [{ publishedAt: null }, { publishedAt: { $lte: new Date() } }],
      })
        .sort({ publishedAt: -1, createdAt: -1 })
        .limit(3)
        .lean();
      return res.json(fallback);
    }

    res.json(items);
  } catch (err) {
    console.error('GET /api/platform/site-news/pinned error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ─── Public: get by slug ───────────────────────────────────────────────────
router.get('/slug/:slug', async (req, res) => {
  try {
    const item = await GoPublicaNews.findOne({
      slug: req.params.slug,
      isActive: true,
      $or: [{ publishedAt: null }, { publishedAt: { $lte: new Date() } }],
    }).lean();

    if (!item) return res.status(404).json({ error: 'News not found' });
    res.json(item);
  } catch (err) {
    console.error('GET /api/platform/site-news/slug/:slug error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ─── Admin: list all news ──────────────────────────────────────────────────
router.get('/all', auth, async (req, res) => {
  try {
    const { category, isActive } = req.query;
    const filter = {};
    if (category) filter.category = category;
    if (isActive !== undefined) filter.isActive = isActive === 'true';

    const items = await GoPublicaNews.find(filter)
      .sort({ createdAt: -1 })
      .lean();
    res.json(items);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Admin: get single item ────────────────────────────────────────────────
router.get('/:id', auth, async (req, res) => {
  try {
    const item = await GoPublicaNews.findById(req.params.id).lean();
    if (!item) return res.status(404).json({ error: 'News item not found' });
    res.json(item);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Admin: create news ────────────────────────────────────────────────────
router.post('/', auth, async (req, res) => {
  try {
    const {
      title, titleI18n, slug, category, mediaType,
      coverImage, videoUrl, body, bodyI18n,
      excerpt, excerptI18n, seoTitle, seoTitleI18n,
      seoDescription, seoDescriptionI18n,
      author, isPinned, pinnedOrder, isActive, publishedAt,
    } = req.body;

    if (!title) return res.status(400).json({ error: 'Title is required' });

    // Generate slug from title if not provided
    let finalSlug = slug || generateSlug(title);

    // Ensure unique slug
    const existing = await GoPublicaNews.findOne({ slug: finalSlug });
    if (existing) {
      finalSlug = `${finalSlug}-${Date.now()}`;
    }

    const item = new GoPublicaNews({
      title,
      titleI18n: titleI18n || {},
      slug: finalSlug,
      category: category || 'company',
      mediaType: mediaType || 'text',
      coverImage: coverImage || '',
      videoUrl: videoUrl || '',
      body: body || '',
      bodyI18n: bodyI18n || {},
      excerpt: excerpt || '',
      excerptI18n: excerptI18n || {},
      seoTitle: seoTitle || '',
      seoTitleI18n: seoTitleI18n || {},
      seoDescription: seoDescription || '',
      seoDescriptionI18n: seoDescriptionI18n || {},
      author: author || 'GoPublica Team',
      isPinned: isPinned || false,
      pinnedOrder: pinnedOrder || 0,
      isActive: isActive !== undefined ? isActive : true,
      publishedAt: publishedAt ? new Date(publishedAt) : new Date(),
    });

    await item.save();
    res.status(201).json(item);
  } catch (err) {
    console.error('POST /api/platform/site-news error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ─── Admin: update news ────────────────────────────────────────────────────
router.put('/:id', auth, async (req, res) => {
  try {
    const item = await GoPublicaNews.findById(req.params.id);
    if (!item) return res.status(404).json({ error: 'News item not found' });

    const allowed = [
      'title', 'titleI18n', 'slug', 'category', 'mediaType',
      'coverImage', 'videoUrl', 'body', 'bodyI18n',
      'excerpt', 'excerptI18n', 'seoTitle', 'seoTitleI18n',
      'seoDescription', 'seoDescriptionI18n',
      'author', 'isPinned', 'pinnedOrder', 'isActive', 'publishedAt',
    ];

    for (const key of allowed) {
      if (req.body[key] !== undefined) {
        if (key === 'publishedAt') {
          item[key] = req.body[key] ? new Date(req.body[key]) : null;
        } else {
          item[key] = req.body[key];
        }
      }
    }

    // If slug is being changed, ensure uniqueness
    if (req.body.slug && req.body.slug !== item.slug) {
      const existing = await GoPublicaNews.findOne({ slug: req.body.slug, _id: { $ne: item._id } });
      if (existing) {
        item.slug = `${req.body.slug}-${Date.now()}`;
      }
    }

    await item.save();
    res.json(item);
  } catch (err) {
    console.error('PUT /api/platform/site-news/:id error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ─── Admin: delete news ────────────────────────────────────────────────────
router.delete('/:id', auth, async (req, res) => {
  try {
    const item = await GoPublicaNews.findById(req.params.id);
    if (!item) return res.status(404).json({ error: 'News item not found' });

    await GoPublicaNews.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
