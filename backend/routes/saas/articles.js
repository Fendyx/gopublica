const express = require('express');
const router = express.Router();
const Article = require('../../models/Article');

// GET / — list all articles for the authenticated tenant, sorted by publishedAt desc
router.get('/', async (req, res) => {
  try {
    const articles = await Article.find({ tenantId: req.tenantId })
      .sort({ publishedAt: -1 })
      .lean();
    res.json(articles);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST / — create a new article for the authenticated tenant
router.post('/', async (req, res) => {
  try {
    const {
      title,
      slug,
      coverImage,
      body,
      author,
      publishedAt,
      isActive,
      seoTitle,
      seoDescription,
    } = req.body;

    const article = new Article({
      tenantId: req.tenantId,
      title,
      slug,
      coverImage,
      body,
      author,
      publishedAt,
      isActive,
      seoTitle,
      seoDescription,
    });

    await article.save();
    res.status(201).json(article);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /:id — update an article by ID and tenant
router.put('/:id', async (req, res) => {
  try {
    const {
      title,
      slug,
      coverImage,
      body,
      author,
      publishedAt,
      isActive,
      seoTitle,
      seoDescription,
    } = req.body;

    const article = await Article.findOne({ _id: req.params.id, tenantId: req.tenantId });
    if (!article) return res.status(404).json({ error: 'Article not found' });

    if (title !== undefined) article.title = title;
    if (slug !== undefined) article.slug = slug;
    if (coverImage !== undefined) article.coverImage = coverImage;
    if (body !== undefined) article.body = body;
    if (author !== undefined) article.author = author;
    if (publishedAt !== undefined) article.publishedAt = publishedAt;
    if (isActive !== undefined) article.isActive = isActive;
    if (seoTitle !== undefined) article.seoTitle = seoTitle;
    if (seoDescription !== undefined) article.seoDescription = seoDescription;

    await article.save();
    res.json(article);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /:id — delete an article by ID and tenant
router.delete('/:id', async (req, res) => {
  try {
    const article = await Article.findOneAndDelete({ _id: req.params.id, tenantId: req.tenantId });
    if (!article) return res.status(404).json({ error: 'Article not found' });
    res.json({ message: 'Article deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
