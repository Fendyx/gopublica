const express = require('express');
const router = express.Router();
const Article = require('../../models/content/Article');
const Event = require('../../models/content/Event');

// ─── Helper: merge Event commerce fields into an Article object ──────────
// Articles that have no linked Event remain unchanged (standard article).
// Articles with a linked Event get their ticket fields injected inline so
// the frontend receives a unified payload without a second request.
async function mergeEventIntoArticle(article) {
  if (!article) return article;

  const event = await Event.findOne({
    articleId: article._id,
    tenantId: article.tenantId,
  }).lean();

  if (!event) return article;

  return {
    ...article,
    isEvent: true,
    ticketPrice: event.ticketPrice,
    totalTickets: event.totalTickets,
    ticketsSold: event.ticketsSold,
    ticketsRemaining: event.ticketsRemaining,
    eventDate: event.eventDate,
    eventTime: event.eventTime,
    venueName: event.venueName,
    venueAddress: event.venueAddress,
    maxPerOrder: event.maxPerOrder,
    eventIsActive: event.isActive,
  };
}

// GET / - list all articles for the authenticated tenant, sorted by publishedAt desc
router.get('/', async (req, res) => {
  try {
    const articles = await Article.find({ tenantId: req.tenantId })
      .sort({ publishedAt: -1 })
      .lean();

    // Fetch all linked Events for this tenant in one query
    const articleIds = articles.map(a => a._id);
    const events = await Event.find({
      articleId: { $in: articleIds },
      tenantId: req.tenantId,
    }).lean();

    // Build a map of articleId → event for O(1) lookup
    const eventMap = new Map(events.map(e => [e.articleId.toString(), e]));

    // Merge event data into each article
    const enriched = articles.map(article => {
      const event = eventMap.get(article._id.toString());
      if (!event) return article;

      return {
        ...article,
        isEvent: true,
        ticketPrice: event.ticketPrice,
        totalTickets: event.totalTickets,
        ticketsSold: event.ticketsSold,
        ticketsRemaining: event.ticketsRemaining,
        eventDate: event.eventDate,
        eventTime: event.eventTime,
        venueName: event.venueName,
        venueAddress: event.venueAddress,
        maxPerOrder: event.maxPerOrder,
        eventIsActive: event.isActive,
      };
    });

    res.json(enriched);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST / - create a new article for the authenticated tenant
router.post('/', async (req, res) => {
  try {
    const {
      title,
      slug,
      coverImage,
      videoUrl,
      body,
      author,
      publishedAt,
      isActive,
      seoTitle,
      seoDescription,
      sidebarType,
      contentType,
    } = req.body;

    const article = new Article({
      tenantId: req.tenantId,
      title,
      slug,
      coverImage,
      videoUrl,
      body,
      author,
      publishedAt,
      isActive,
      seoTitle,
      seoDescription,
      sidebarType: sidebarType || 'none',
      contentType: contentType || 'article',
    });

    await article.save();
    res.status(201).json(article);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /:id - update an article by ID and tenant
router.put('/:id', async (req, res) => {
  try {
    const {
      title,
      slug,
      coverImage,
      videoUrl,
      body,
      author,
      publishedAt,
      isActive,
      seoTitle,
      seoDescription,
      sidebarType,
      contentType,
    } = req.body;

    const article = await Article.findOne({ _id: req.params.id, tenantId: req.tenantId });
    if (!article) return res.status(404).json({ error: 'Article not found' });

    if (title !== undefined) article.title = title;
    if (slug !== undefined) article.slug = slug;
    if (coverImage !== undefined) article.coverImage = coverImage;
    if (videoUrl !== undefined) article.videoUrl = videoUrl;
    if (body !== undefined) article.body = body;
    if (author !== undefined) article.author = author;
    if (publishedAt !== undefined) article.publishedAt = publishedAt;
    if (isActive !== undefined) article.isActive = isActive;
    if (seoTitle !== undefined) article.seoTitle = seoTitle;
    if (seoDescription !== undefined) article.seoDescription = seoDescription;
    if (sidebarType !== undefined) article.sidebarType = sidebarType;
    if (contentType !== undefined) article.contentType = contentType;

    await article.save();
    res.json(article);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /:id - delete an article by ID and tenant
router.delete('/:id', async (req, res) => {
  try {
    const article = await Article.findOneAndDelete({ _id: req.params.id, tenantId: req.tenantId });
    if (!article) return res.status(404).json({ error: 'Article not found' });
    res.json({ message: 'Article deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /:id - single article by ID with merged Event data
router.get('/:id', async (req, res) => {
  try {
    const article = await Article.findOne({
      _id: req.params.id,
      tenantId: req.tenantId,
    }).lean();

    if (!article) return res.status(404).json({ error: 'Article not found' });

    const enriched = await mergeEventIntoArticle(article);
    res.json(enriched);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
