const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Reservation = require('../../models/food/Reservation');
const Branch = require('../../models/Branch');
const authTenant = require('../../middleware/auth/tenant');
const { writeConsentLog } = require('../../services/consent/writeConsent');

// Helper: check if a string is a valid MongoDB ObjectId (24-char hex)
function isValidObjectId(str) {
  return mongoose.Types.ObjectId.isValid(str) && /^[0-9a-fA-F]{24}$/.test(str);
}

// Публичный: создание брони (теперь с branchId или branchSlug)
router.post('/', async (req, res) => {
  try {
    const { tenantId } = req.query;
    const { branchId, branchSlug, name, phone, email, date, time, guests, comment, consents } = req.body;

    let resolvedBranchId = branchId;

    // If branchId is provided but is NOT a valid ObjectId, treat it as a slug
    if (resolvedBranchId && !isValidObjectId(resolvedBranchId)) {
      const branch = await Branch.findOne({ slug: resolvedBranchId, tenantId });
      if (!branch) return res.status(404).json({ error: 'Филиал не найден или не принадлежит тенанту' });
      resolvedBranchId = branch._id;
    }

    // If branchSlug is provided, resolve it to a branchId
    if (!resolvedBranchId && branchSlug) {
      const branch = await Branch.findOne({ slug: branchSlug, tenantId });
      if (!branch) return res.status(404).json({ error: 'Филиал не найден или не принадлежит тенанту' });
      resolvedBranchId = branch._id;
    }

    if (!resolvedBranchId) return res.status(400).json({ error: 'branchId или branchSlug обязателен' });

    // Проверяем, что филиал принадлежит этому тенанту
    const branch = await Branch.findOne({ _id: resolvedBranchId, tenantId });
    if (!branch) return res.status(404).json({ error: 'Филиал не найден или не принадлежит тенанту' });

    const reservation = new Reservation({
      tenantId,
      branchId: resolvedBranchId,
      name,
      phone,
      email,
      date,
      time,
      guests,
      comment,
    });
    console.log('🟢 [RESERVATION] Reservation created (unsaved), _id:', reservation._id);

    // ── GDPR: Record consent (best-effort - never block reservation) ──
    if (consents) {
      console.log('🟢 [RESERVATION] Writing consent log...', consents);
      try {
        reservation._consent = await writeConsentLog({
          entityType: 'Reservation',
          entityId: reservation._id,
          tenantId,
          consents,
          context: req.consentContext,
        });
        console.log('🟢 [RESERVATION] Consent log written:', JSON.stringify(reservation._consent));
      } catch (consentErr) {
        console.error('⚠️ Consent logging failed for Reservation:', consentErr.message);
        console.error('⚠️ Consent logging error stack:', consentErr.stack);
      }
    }

    console.log('🟢 [RESERVATION] Calling reservation.save()...');
    await reservation.save();
    console.log('🟢 [RESERVATION] Reservation saved successfully, _id:', reservation._id);

    // Fire-and-forget tenant Telegram notification
    require('../../services/notifications/tenantTelegram')
      .notifyNewReservation(tenantId, resolvedBranchId, reservation)
      .catch(err => console.error('Tenant Telegram reservation notification failed:', err.message));

    console.log('🟢 [RESERVATION] Sending 201 response...');
    res.status(201).json(reservation);
  } catch (err) {
    console.error('🔴 [RESERVATION] POST /api/saas/reservations error:');
    console.error('🔴 error name:', err.name);
    console.error('🔴 error message:', err.message);
    console.error('🔴 error stack:', err.stack);
    console.error('🔴 error object keys:', Object.keys(err));
    if (err.errors) console.error('🔴 validation errors:', JSON.stringify(err.errors, null, 2));
    res.status(500).json({ error: err.message });
  }
});

// Защищённый: список броней (с фильтром по branchId или branchSlug)
router.get('/', authTenant, async (req, res) => {
  try {
    const { branchId, branchSlug } = req.query;
    const query = { tenantId: req.tenantId };

    let resolvedBranchId = branchId;

    // If branchId is provided but is NOT a valid ObjectId, treat it as a slug
    if (resolvedBranchId && !isValidObjectId(resolvedBranchId)) {
      const branch = await Branch.findOne({ slug: resolvedBranchId, tenantId: req.tenantId }).lean();
      if (!branch) return res.status(404).json({ error: 'Branch not found for slug' });
      resolvedBranchId = branch._id;
    }

    // If branchSlug is provided, resolve it to a branchId
    if (!resolvedBranchId && branchSlug) {
      const branch = await Branch.findOne({ slug: branchSlug, tenantId: req.tenantId }).lean();
      if (!branch) return res.status(404).json({ error: 'Branch not found' });
      resolvedBranchId = branch._id;
    }

    if (resolvedBranchId) query.branchId = resolvedBranchId;
    const reservations = await Reservation.find(query).sort({ date: 1, time: 1 }).lean();
    res.json(reservations);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Изменение статуса
router.patch('/:id', authTenant, async (req, res) => {
  try {
    const reservation = await Reservation.findById(req.params.id);
    if (!reservation) return res.status(404).json({ error: 'Не найдено' });
    if (reservation.tenantId !== req.tenantId) return res.status(403).json({ error: 'Нет доступа' });
    reservation.status = req.body.status;
    await reservation.save();
    res.json(reservation);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Удаление
router.delete('/:id', authTenant, async (req, res) => {
  try {
    const reservation = await Reservation.findById(req.params.id);
    if (!reservation) return res.status(404).json({ error: 'Не найдено' });
    if (reservation.tenantId !== req.tenantId) return res.status(403).json({ error: 'Нет доступа' });
    await Reservation.findByIdAndDelete(req.params.id);
    res.json({ message: 'Удалено' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;