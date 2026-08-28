const express = require('express');
const router = express.Router();
const Event = require('../../models/Event');
const Article = require('../../models/Article');

// ─── GET /api/public/events — list active events for a tenant ─────────────
// Query params: tenantId (required), upcomingOnly (optional, default true)
router.get('/', async (req, res) => {
  try {
    const { tenantId, upcomingOnly = 'true' } = req.query;

    if (!tenantId) {
      return res.status(400).json({ error: 'tenantId is required' });
    }

    const now = new Date();
    const filter = {
      tenantId,
      isActive: true,
    };

    if (upcomingOnly === 'true') {
      filter.eventDate = { $gte: now };
    }

    const events = await Event.find(filter)
      .sort({ eventDate: 1 })
      .lean();

    // Fetch all linked Articles in a single batched query (fixes N+1)
    const articleIds = events.map(e => e.articleId);
    const articles = await Article.find({
      _id: { $in: articleIds },
      tenantId,
      isActive: true,
    })
      .select('title slug coverImage body bodyFormat author publishedAt')
      .lean();

    // Build a map of articleId → article for O(1) lookup
    const articleMap = new Map(articles.map(a => [a._id.toString(), a]));

    const eventsWithArticles = events.map(event => ({
      ...event,
      article: articleMap.get(event.articleId.toString()) || null,
    }));

    res.json(eventsWithArticles);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── GET /api/public/events/:slug — single event by Article slug ──────────
// Returns Event + full Article (including body) in one request
router.get('/:slug', async (req, res) => {
  try {
    const { tenantId } = req.query;
    if (!tenantId) {
      return res.status(400).json({ error: 'tenantId is required' });
    }

    // First find the Article by slug
    const article = await Article.findOne({
      slug: req.params.slug,
      tenantId,
      isActive: true,
    }).lean();

    if (!article) {
      return res.status(404).json({ error: 'Article not found' });
    }

    // Then find the linked Event
    const event = await Event.findOne({
      articleId: article._id,
      tenantId,
      isActive: true,
    }).lean();

    if (!event) {
      return res.status(404).json({ error: 'Event not found for this article' });
    }

    res.json({ event, article });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── GET /api/public/events/:slug/availability — check ticket stock ───────
router.get('/:slug/availability', async (req, res) => {
  try {
    const { tenantId } = req.query;
    if (!tenantId) {
      return res.status(400).json({ error: 'tenantId is required' });
    }

    const article = await Article.findOne({
      slug: req.params.slug,
      tenantId,
      isActive: true,
    }).lean();

    if (!article) {
      return res.status(404).json({ error: 'Article not found' });
    }

    const event = await Event.findOne({
      articleId: article._id,
      tenantId,
      isActive: true,
    }).lean();

    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    res.json({
      ticketsRemaining: event.ticketsRemaining,
      totalTickets: event.totalTickets,
      ticketsSold: event.ticketsSold,
      isSoldOut: event.isSoldOut,
      maxPerOrder: event.maxPerOrder,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;