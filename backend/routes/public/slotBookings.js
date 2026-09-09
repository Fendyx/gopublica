const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const webpush = require('web-push');
const Branch = require('../../models/Branch');
const PushSubscription = require('../../models/communication/PushSubscription');
const { writeConsentLog } = require('../../services/consent/writeConsent');
const {
  getAvailableSlots,
  findNextAvailable,
  bookSlot,
  generateSlotsForDate,
} = require('../../services/booking/slots');

function isValidObjectId(str) {
  return mongoose.Types.ObjectId.isValid(str) && /^[0-9a-fA-F]{24}$/.test(str);
}

// ── GET /slots — Get available slots for a date ──────────────────────────
router.get('/slots', async (req, res) => {
  try {
    const { tenantId } = req.query;
    let { branchId, branchSlug, date } = req.query;

    if (!tenantId) return res.status(400).json({ error: 'tenantId is required' });
    if (!date) return res.status(400).json({ error: 'date is required' });

    // Resolve branch
    if (branchId && !isValidObjectId(branchId)) {
      const branch = await Branch.findOne({ slug: branchId, tenantId }).lean();
      if (!branch) return res.status(404).json({ error: 'Branch not found' });
      branchId = branch._id;
    }
    if (!branchId && branchSlug) {
      const branch = await Branch.findOne({ slug: branchSlug, tenantId }).lean();
      if (!branch) return res.status(404).json({ error: 'Branch not found' });
      branchId = branch._id;
    }
    if (!branchId) return res.status(400).json({ error: 'branchId or branchSlug is required' });

    const slots = await getAvailableSlots(tenantId, branchId, date);
    res.json(slots);
  } catch (err) {
    console.error('🔴 [SLOT-BOOKINGS] GET /slots error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ── GET /slots/next-available — Find the next available slot ─────────────
router.get('/slots/next-available', async (req, res) => {
  try {
    const { tenantId } = req.query;
    let { branchId, branchSlug, fromDate, fromTime } = req.query;

    if (!tenantId) return res.status(400).json({ error: 'tenantId is required' });
    if (!fromDate) return res.status(400).json({ error: 'fromDate is required' });
    if (!fromTime) fromTime = '00:00';

    // Resolve branch
    if (branchId && !isValidObjectId(branchId)) {
      const branch = await Branch.findOne({ slug: branchId, tenantId }).lean();
      if (!branch) return res.status(404).json({ error: 'Branch not found' });
      branchId = branch._id;
    }
    if (!branchId && branchSlug) {
      const branch = await Branch.findOne({ slug: branchSlug, tenantId }).lean();
      if (!branch) return res.status(404).json({ error: 'Branch not found' });
      branchId = branch._id;
    }
    if (!branchId) return res.status(400).json({ error: 'branchId or branchSlug is required' });

    const result = await findNextAvailable(tenantId, branchId, fromDate, fromTime);
    if (!result) {
      return res.json({ slot: null, remaining: 0, message: 'No available slots found in the next 30 days' });
    }
    res.json(result);
  } catch (err) {
    console.error('🔴 [SLOT-BOOKINGS] GET /slots/next-available error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ── POST /book — Create a slot booking ───────────────────────────────────
router.post('/book', async (req, res) => {
  try {
    const { tenantId } = req.query;
    const { branchId, branchSlug, slotId, name, phone, email, partySize, comment, consents } = req.body;

    if (!tenantId) return res.status(400).json({ error: 'tenantId is required' });
    if (!slotId) return res.status(400).json({ error: 'slotId is required' });
    if (!name || !phone) return res.status(400).json({ error: 'name and phone are required' });
    if (!partySize || partySize < 1) return res.status(400).json({ error: 'partySize must be at least 1' });

    // Resolve branchId for consent logging
    let resolvedBranchId = branchId;
    if (resolvedBranchId && !isValidObjectId(resolvedBranchId)) {
      const branch = await Branch.findOne({ slug: resolvedBranchId, tenantId }).lean();
      if (!branch) return res.status(404).json({ error: 'Branch not found' });
      resolvedBranchId = branch._id;
    }
    if (!resolvedBranchId && branchSlug) {
      const branch = await Branch.findOne({ slug: branchSlug, tenantId }).lean();
      if (!branch) return res.status(404).json({ error: 'Branch not found' });
      resolvedBranchId = branch._id;
    }

    const result = await bookSlot(tenantId, resolvedBranchId || branchId, slotId, {
      name,
      phone,
      email,
      partySize,
      comment,
    });

    if (result.error === 'SLOT_FULL') {
      return res.status(409).json({
        error: 'This slot is fully booked',
        remaining: result.remaining,
      });
    }
    if (result.error === 'SLOT_NOT_FOUND') {
      return res.status(404).json({ error: 'Slot not found' });
    }
    if (result.error === 'FORBIDDEN') {
      return res.status(403).json({ error: 'Access denied' });
    }

    const { booking, slot } = result;

    // GDPR consent
    if (consents && resolvedBranchId) {
      try {
        booking._consent = await writeConsentLog({
          entityType: 'SlotBooking',
          entityId: booking._id,
          tenantId,
          consents,
          context: req.consentContext,
        });
        await booking.save();
      } catch (consentErr) {
        console.error('⚠️ Consent logging failed for SlotBooking:', consentErr.message);
      }
    }

    // Fire-and-forget Telegram notification
    require('../../services/notifications/tenantTelegram')
      .notifyNewReservation(tenantId, String(resolvedBranchId || branchId), {
        name,
        date: slot.date,
        time: slot.startTime,
        guests: partySize,
        comment,
      })
      .catch(err => console.error('Slot booking Telegram notification failed:', err.message));

    // Push notifications
    const subs = await PushSubscription.find({ tenantId });
    if (subs.length > 0) {
      const branch = resolvedBranchId ? await Branch.findById(resolvedBranchId).lean() : null;
      const payload = JSON.stringify({
        title: '🎯 Neue Buchung',
        body: `${name} · ${slot.date} ${slot.startTime}–${slot.endTime} · ${partySize} Person${partySize > 1 ? 'en' : ''}${branch ? ` · ${branch.city || ''} ${branch.name}` : ''}`,
        tag: `slot-booking-${booking._id}`,
        url: '/admin/slots',
      });

      const results = await Promise.allSettled(
        subs.map(sub => webpush.sendNotification(sub.subscription, payload))
      );

      const expiredEndpoints = results
        .map((r, i) => ({ r, sub: subs[i] }))
        .filter(({ r }) => r.status === 'rejected' && r.reason?.statusCode === 410)
        .map(({ sub }) => sub.endpoint);

      if (expiredEndpoints.length > 0) {
        await PushSubscription.deleteMany({ endpoint: { $in: expiredEndpoints } });
      }
    }

    res.status(201).json({ booking, slot });
  } catch (err) {
    console.error('🔴 [SLOT-BOOKINGS] POST /book error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ── POST /generate — Generate slots for a date (public, auto-generate) ───
router.post('/generate', async (req, res) => {
  try {
    const { tenantId } = req.query;
    const { branchId, branchSlug, date, slotStartTime, slotEndTime, slotIntervalMinutes, slotCapacity } = req.body;

    if (!tenantId) return res.status(400).json({ error: 'tenantId is required' });
    if (!date) return res.status(400).json({ error: 'date is required' });

    // Resolve branch
    let resolvedBranchId = branchId;
    if (resolvedBranchId && !isValidObjectId(resolvedBranchId)) {
      const branch = await Branch.findOne({ slug: resolvedBranchId, tenantId }).lean();
      if (!branch) return res.status(404).json({ error: 'Branch not found' });
      resolvedBranchId = branch._id;
    }
    if (!resolvedBranchId && branchSlug) {
      const branch = await Branch.findOne({ slug: branchSlug, tenantId }).lean();
      if (!branch) return res.status(404).json({ error: 'Branch not found' });
      resolvedBranchId = branch._id;
    }
    if (!resolvedBranchId) return res.status(400).json({ error: 'branchId or branchSlug is required' });

    const slots = await generateSlotsForDate(tenantId, resolvedBranchId, date, {
      slotStartTime: slotStartTime || '09:00',
      slotEndTime: slotEndTime || '22:00',
      slotIntervalMinutes: slotIntervalMinutes || 60,
      slotCapacity: slotCapacity || 10,
    });

    res.status(201).json(slots);
  } catch (err) {
    console.error('🔴 [SLOT-BOOKINGS] POST /generate error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
