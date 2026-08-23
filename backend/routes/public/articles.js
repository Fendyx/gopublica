const express = require('express');
const router = express.Router();
const Article = require('../../models/Article');
const Event = require('../../models/Event');

// ─── Helper: merge active Event commerce fields into an Article object ─────
// Public side only merges events that are isActive: true.
// Articles with no linked Event, or with an inactive Event, remain unchanged.
async function mergeActiveEventIntoArticle(article) {
  if (!article) return article;

  const event = await Event.findOne({
    articleId: article._id,
    tenantId: article.tenantId,
    isActive: true, // only active events are visible publicly
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
  };
}

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

    // Fetch all linked active Events for this tenant in one query
    const articleIds = articles.map(a => a._id);
    const events = await Event.find({
      articleId: { $in: articleIds },
      tenantId,
      isActive: true,
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
      };
    });

    res.json(enriched);
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

    // Merge active event data for public view
    const enriched = await mergeActiveEventIntoArticle(article);
    res.json(enriched);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
