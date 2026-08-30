const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Event = require('../../models/content/Event');
const Article = require('../../models/content/Article');

// ─── Helper: validate tenant scope ──────────────────────────────────────
function ensureTenant(req, res, next) {
  if (!req.tenantId) {
    return res.status(400).json({ error: 'Tenant context missing' });
  }
  next();
}

// ─── Helper: detect whether transactions are supported ──────────────────
// MongoDB transactions require a replica set. A standalone (single-node)
// instance does NOT support them, and calling startTransaction() on one
// throws a hard MongoError. This helper inspects the live topology so the
// same code works on standalone dev instances and replica-set production.
function supportsTransactions(session) {
  try {
    const topology = session?.client?.topology;
    if (!topology) return false;
    // isReplicaSet is true for replica sets and sharded clusters
    return Boolean(topology.isReplicaSet);
  } catch {
    return false;
  }
}

// ─── GET /api/saas/events — list all events for the authenticated tenant ────
router.get('/', ensureTenant, async (req, res) => {
  try {
    const events = await Event.find({ tenantId: req.tenantId })
      .sort({ eventDate: 1 })
      .lean();
    res.json(events);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── GET /api/saas/events/:id — single event by ID ────────────────────────
router.get('/:id', ensureTenant, async (req, res) => {
  try {
    const event = await Event.findOne({ _id: req.params.id, tenantId: req.tenantId }).lean();
    if (!event) return res.status(404).json({ error: 'Event not found' });
    res.json(event);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── POST /api/saas/events — create Event + Article atomically ────────────
router.post('/', ensureTenant, async (req, res) => {
  const session = await mongoose.startSession();
  const useTransaction = supportsTransactions(session);
  if (useTransaction) session.startTransaction();

  try {
    const {
      // Article fields
      title,
      slug,
      coverImage,
      body,
      bodyFormat = 'block',
      author,
      publishedAt,
      isActive = true,
      seoTitle,
      seoDescription,
      // Event fields
      ticketPrice,
      totalTickets,
      eventDate,
      eventTime,
      venueName,
      venueAddress,
      maxPerOrder = 10,
    } = req.body;

    // ── Validate required fields ────────────────────────────────────────
    if (!title || !slug) {
      return res.status(400).json({ error: 'Article title and slug are required' });
    }
    if (!ticketPrice || ticketPrice < 0) {
      return res.status(400).json({ error: 'Valid ticketPrice is required' });
    }
    if (!totalTickets || totalTickets < 1) {
      return res.status(400).json({ error: 'totalTickets must be >= 1' });
    }
    if (!eventDate) {
      return res.status(400).json({ error: 'eventDate is required' });
    }

    // ── Create Article ──────────────────────────────────────────────────
    const article = new Article({
      tenantId: req.tenantId,
      title,
      slug,
      coverImage,
      body,
      bodyFormat,
      author,
      publishedAt,
      isActive,
      seoTitle,
      seoDescription,
    });
    await article.save({ session });

    // ── Create Event linked to Article ──────────────────────────────────
    const event = new Event({
      tenantId: req.tenantId,
      articleId: article._id,
      ticketPrice,
      totalTickets,
      ticketsRemaining: totalTickets, // initially all available
      ticketsSold: 0,
      eventDate: new Date(eventDate),
      eventTime: eventTime || '',
      venueName: venueName || '',
      venueAddress: venueAddress || '',
      maxPerOrder,
      isActive,
    });
    await event.save({ session });

    if (useTransaction) await session.commitTransaction();
    session.endSession();

    res.status(201).json({ article, event });
  } catch (err) {
    if (useTransaction) {
      try { await session.abortTransaction(); } catch { /* ignore */ }
    }
    session.endSession();

    // Mongoose reports duplicate key errors as code 11000 or 'E11000'
    if (err.code === 11000 || err.code === 'E11000') {
      // Determine which field caused the duplicate for a cleaner message
      const fieldMatch = /index: ([a-zA-Z0-9_]+)_/.exec(err.message) ||
                         /key: \{ ([a-zA-Z0-9_]+):/.exec(err.message);
      const field = fieldMatch ? fieldMatch[1] : null;

      const message = field === 'slug'
        ? 'An article with this slug already exists for this tenant.'
        : 'A duplicate record already exists for this tenant.';
      return res.status(409).json({ error: message, field: field || undefined });
    }
    res.status(500).json({ error: err.message });
  }
});

// ─── PUT /api/saas/events/:id — update Event + Article ────────────────────
// Supports upsert: if the Article exists but has no linked Event yet,
// a new Event is created (e.g. user toggles "Sell Tickets" ON for a
// standard article).
router.put('/:id', ensureTenant, async (req, res) => {
  const session = await mongoose.startSession();
  const useTransaction = supportsTransactions(session);
  if (useTransaction) session.startTransaction();

  try {
    const {
      // Article fields
      title,
      slug,
      coverImage,
      body,
      bodyFormat,
      author,
      publishedAt,
      isActive,
      seoTitle,
      seoDescription,
      // Event fields
      ticketPrice,
      totalTickets,
      eventDate,
      eventTime,
      venueName,
      venueAddress,
      maxPerOrder,
    } = req.body;

    // ── 1. Find & update the Article ─────────────────────────────────────
    const article = await Article.findOne({ _id: req.params.id, tenantId: req.tenantId }).session(session);
    if (!article) {
      if (useTransaction) {
        try { await session.abortTransaction(); } catch { /* ignore */ }
      }
      session.endSession();
      return res.status(404).json({ error: 'Article not found' });
    }

    if (title !== undefined) article.title = title;
    if (slug !== undefined) article.slug = slug;
    if (coverImage !== undefined) article.coverImage = coverImage;
    if (body !== undefined) article.body = body;
    if (bodyFormat !== undefined) article.bodyFormat = bodyFormat;
    if (author !== undefined) article.author = author;
    if (publishedAt !== undefined) article.publishedAt = publishedAt;
    if (isActive !== undefined) article.isActive = isActive;
    if (seoTitle !== undefined) article.seoTitle = seoTitle;
    if (seoDescription !== undefined) article.seoDescription = seoDescription;

    await article.save({ session });

    // ── 2. Upsert the Event ──────────────────────────────────────────────
    // Build the update payload from provided fields
    const eventUpdate = {};
    if (ticketPrice !== undefined) eventUpdate.ticketPrice = ticketPrice;
    if (totalTickets !== undefined) {
      // When totalTickets changes, adjust ticketsRemaining proportionally
      // (only applies to existing events; new events set ticketsRemaining = totalTickets)
      eventUpdate.$set = eventUpdate.$set || {};
      eventUpdate.$set.totalTickets = totalTickets;
    }
    if (eventDate !== undefined) eventUpdate.eventDate = new Date(eventDate);
    if (eventTime !== undefined) eventUpdate.eventTime = eventTime;
    if (venueName !== undefined) eventUpdate.venueName = venueName;
    if (venueAddress !== undefined) eventUpdate.venueAddress = venueAddress;
    if (maxPerOrder !== undefined) eventUpdate.maxPerOrder = maxPerOrder;
    if (isActive !== undefined) eventUpdate.isActive = isActive;

    // For upsert: ensure required fields have defaults
    const upsertPayload = {
      tenantId: req.tenantId,
      articleId: article._id,
      ticketPrice: ticketPrice !== undefined ? ticketPrice : 0,
      totalTickets: totalTickets !== undefined ? totalTickets : 0,
      ticketsRemaining: totalTickets !== undefined ? totalTickets : 0,
      ticketsSold: 0,
      eventDate: eventDate !== undefined ? new Date(eventDate) : new Date(),
      eventTime: eventTime || '',
      venueName: venueName || '',
      venueAddress: venueAddress || '',
      maxPerOrder: maxPerOrder !== undefined ? maxPerOrder : 10,
      isActive: isActive !== undefined ? isActive : true,
    };

    // Merge update fields into upsert payload
    Object.assign(upsertPayload, eventUpdate);

    // Use findOneAndUpdate with upsert
    // If Event exists → update it; if not → create new with upsertPayload
    const event = await Event.findOneAndUpdate(
      { articleId: article._id, tenantId: req.tenantId },
      { $set: upsertPayload },
      { upsert: true, new: true, session }
    );

    // If totalTickets was updated on an existing event, adjust ticketsRemaining
    if (totalTickets !== undefined && event.ticketsSold > 0) {
      const newRemaining = Math.max(0, totalTickets - event.ticketsSold);
      if (event.ticketsRemaining !== newRemaining) {
        await Event.updateOne(
          { _id: event._id },
          { $set: { ticketsRemaining: newRemaining } }
        ).session(session);
        event.ticketsRemaining = newRemaining;
      }
    }

    if (useTransaction) await session.commitTransaction();
    session.endSession();

    res.json({ article, event });
  } catch (err) {
    if (useTransaction) {
      try { await session.abortTransaction(); } catch { /* ignore */ }
    }
    session.endSession();

    if (err.code === 11000 || err.code === 'E11000') {
      const fieldMatch = /index: ([a-zA-Z0-9_]+)_/.exec(err.message) ||
                         /key: \{ ([a-zA-Z0-9_]+):/.exec(err.message);
      const field = fieldMatch ? fieldMatch[1] : null;
      const message = field === 'slug'
        ? 'An article with this slug already exists for this tenant.'
        : 'A duplicate record already exists for this tenant.';
      return res.status(409).json({ error: message, field: field || undefined });
    }
    res.status(500).json({ error: err.message });
  }
});

// ─── DELETE /api/saas/events/:id — delete Event + Article ─────────────────
router.delete('/:id', ensureTenant, async (req, res) => {
  const session = await mongoose.startSession();
  const useTransaction = supportsTransactions(session);
  if (useTransaction) session.startTransaction();

  try {
    const event = await Event.findOne({ _id: req.params.id, tenantId: req.tenantId }).session(session);
    if (!event) {
      if (useTransaction) {
        try { await session.abortTransaction(); } catch { /* ignore */ }
      }
      session.endSession();
      return res.status(404).json({ error: 'Event not found' });
    }

    // Delete linked Article
    await Article.findOneAndDelete({ _id: event.articleId, tenantId: req.tenantId }).session(session);
    // Delete Event
    await Event.findOneAndDelete({ _id: event._id, tenantId: req.tenantId }).session(session);

    if (useTransaction) await session.commitTransaction();
    session.endSession();

    res.json({ message: 'Event and linked Article deleted' });
  } catch (err) {
    if (useTransaction) {
      try { await session.abortTransaction(); } catch { /* ignore */ }
    }
    session.endSession();

    if (err.code === 11000 || err.code === 'E11000') {
      const fieldMatch = /index: ([a-zA-Z0-9_]+)_/.exec(err.message) ||
                         /key: \{ ([a-zA-Z0-9_]+):/.exec(err.message);
      const field = fieldMatch ? fieldMatch[1] : null;
      const message = field === 'slug'
        ? 'An article with this slug already exists for this tenant.'
        : 'A duplicate record already exists for this tenant.';
      return res.status(409).json({ error: message, field: field || undefined });
    }
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;