const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const StaffShift = require('../../models/tenant/StaffShift');
const StaffMember = require('../../models/tenant/StaffMember');
const authTenant = require('../../middleware/auth/tenant');

// ── GET /api/saas/staff-shifts ───────────────────────────────────────────────
// List shifts for a date range. Supports filtering by staffId.
// Query params: from, to (YYYY-MM-DD), staffId
router.get('/', authTenant, async (req, res) => {
  try {
    const { from, to, staffId } = req.query;
    const query = { tenantId: req.tenantId };

    // Date range filter (inclusive)
    if (from || to) {
      query.date = {};
      if (from) query.date.$gte = from;
      if (to) query.date.$lte = to;
    }

    if (staffId) {
      if (!mongoose.Types.ObjectId.isValid(staffId)) {
        return res.status(400).json({ error: 'Invalid staffId' });
      }
      query.staffId = staffId;
    }

    const shifts = await StaffShift.find(query).sort({ date: 1, start: 1 }).lean();
    res.json(shifts);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── POST /api/saas/staff-shifts ──────────────────────────────────────────────
// Create a single shift
router.post('/', authTenant, async (req, res) => {
  try {
    const { staffId, date, start, end, status, notes, branchId } = req.body;

    if (!staffId || !date || !start || !end) {
      return res.status(400).json({ error: 'staffId, date, start, and end are required' });
    }

    // Verify the staff member belongs to this tenant
    const member = await StaffMember.findOne({ _id: staffId, tenantId: req.tenantId }).lean();
    if (!member) return res.status(404).json({ error: 'Staff member not found' });

    const shift = new StaffShift({
      tenantId: req.tenantId,
      branchId: branchId || member.branchId || null,
      staffId,
      date,
      start,
      end,
      status: status || 'scheduled',
      notes: notes || '',
    });
    await shift.save();
    res.status(201).json(shift);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── PUT /api/saas/staff-shifts/:id ───────────────────────────────────────────
// Update a shift
router.put('/:id', authTenant, async (req, res) => {
  try {
    const shift = await StaffShift.findOne({ _id: req.params.id, tenantId: req.tenantId });
    if (!shift) return res.status(404).json({ error: 'Shift not found' });
    Object.assign(shift, req.body);
    await shift.save();
    res.json(shift);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── DELETE /api/saas/staff-shifts/:id ────────────────────────────────────────
// Delete a shift
router.delete('/:id', authTenant, async (req, res) => {
  try {
    const shift = await StaffShift.findOne({ _id: req.params.id, tenantId: req.tenantId });
    if (!shift) return res.status(404).json({ error: 'Shift not found' });
    await StaffShift.findByIdAndDelete(req.params.id);
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── POST /api/saas/staff-shifts/bulk ─────────────────────────────────────────
// Bulk create shifts — useful for "copy weekly template to dates" or batch assignment.
// Body: { shifts: [{ staffId, date, start, end, status?, notes? }] }
// Also supports "applyTemplate": { staffId, dates: ["2026-09-12", ...] }
//   which copies the staff member's weekly schedule template to the given dates.
router.post('/bulk', authTenant, async (req, res) => {
  try {
    const { shifts: explicitShifts, applyTemplate } = req.body;

    // ── Mode 1: Explicit shift array ──
    if (Array.isArray(explicitShifts) && explicitShifts.length > 0) {
      const toInsert = [];
      for (const s of explicitShifts) {
        if (!s.staffId || !s.date || !s.start || !s.end) continue;
        // Verify staff belongs to tenant
        const member = await StaffMember.findOne({ _id: s.staffId, tenantId: req.tenantId }).lean();
        if (!member) continue;
        toInsert.push({
          tenantId: req.tenantId,
          branchId: s.branchId || member.branchId || null,
          staffId: s.staffId,
          date: s.date,
          start: s.start,
          end: s.end,
          status: s.status || 'scheduled',
          notes: s.notes || '',
        });
      }
      if (toInsert.length === 0) {
        return res.status(400).json({ error: 'No valid shifts to insert' });
      }
      const created = await StaffShift.insertMany(toInsert, { ordered: false });
      return res.status(201).json({ count: created.length, shifts: created });
    }

    // ── Mode 2: Apply weekly template to specific dates ──
    if (applyTemplate?.staffId && Array.isArray(applyTemplate.dates)) {
      const { staffId, dates } = applyTemplate;
      const member = await StaffMember.findOne({ _id: staffId, tenantId: req.tenantId }).lean();
      if (!member) return res.status(404).json({ error: 'Staff member not found' });

      const DAY_MAP = {
        0: 'sunday', 1: 'monday', 2: 'tuesday', 3: 'wednesday',
        4: 'thursday', 5: 'friday', 6: 'saturday',
      };
      const schedule = member.schedule || {};
      const toInsert = [];

      for (const dateStr of dates) {
        const d = new Date(dateStr + 'T00:00:00');
        const dayName = DAY_MAP[d.getDay()];
        const daySlots = schedule[dayName];
        if (!daySlots || daySlots.length === 0) continue;

        for (const slot of daySlots) {
          if (!slot.start || !slot.end) continue;
          toInsert.push({
            tenantId: req.tenantId,
            branchId: member.branchId || null,
            staffId,
            date: dateStr,
            start: slot.start,
            end: slot.end,
            status: 'scheduled',
          });
        }
      }

      if (toInsert.length === 0) {
        return res.status(200).json({ count: 0, shifts: [], message: 'No working hours in template for given dates' });
      }
      const created = await StaffShift.insertMany(toInsert, { ordered: false });
      return res.status(201).json({ count: created.length, shifts: created });
    }

    return res.status(400).json({ error: 'Provide either shifts[] or applyTemplate { staffId, dates[] }' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
