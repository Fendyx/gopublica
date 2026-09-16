const express = require('express');
const router = express.Router();
const TenantSettings = require('../../models/TenantSettings');
const MenuItem = require('../../models/food/MenuItem');
const Reservation = require('../../models/food/Reservation');
const Order = require('../../models/food/Order');
const BeautyService = require('../../models/beauty/ServiceItem');
const BeautyMaster = require('../../models/beauty/Master');
const BeautyAppointment = require('../../models/beauty/Appointment');
const GalleryItem = require('../../models/content/GalleryItem');
const JobApplication = require('../../models/hr/JobApplication');
const authTenant = require('../../middleware/auth/tenant');
const Branch = require('../../models/Branch');

// ─── Niche-aware setup checklist ─────────────────────────────────────────────
async function buildChecklist(tenantId, settings, branch) {
  const niche = settings?.niche || 'food';
  const features = settings?.features || {};
  const contactFilled = Boolean(settings?.phone || settings?.address || settings?.email || branch?.phone || branch?.address || branch?.email);
  const hoursFilled = Boolean(settings?.hours || (branch?.workingHours && Object.values(branch.workingHours).some(v => v && v !== '')));

  const items = [];

  if (niche === 'food' || niche === 'restaurant') {
    const menuCount = await MenuItem.countDocuments({ tenantId, status: { $ne: 'hidden' } });
    items.push({ key: 'menu', label: 'setup.menu', done: menuCount > 0 });
  }

  if (niche === 'beauty') {
    const serviceCount = await BeautyService.countDocuments({ tenantId });
    items.push({ key: 'services', label: 'setup.services', done: serviceCount > 0 });
    const masterCount = await BeautyMaster.countDocuments({ tenantId });
    items.push({ key: 'masters', label: 'setup.masters', done: masterCount > 0 });
  }

  if (features.hasGallery !== false) {
    const galleryCount = await GalleryItem.countDocuments({ tenantId });
    items.push({ key: 'gallery', label: 'setup.gallery', done: galleryCount > 0 });
  }

  if (features.hasMenu !== false && niche !== 'beauty') {
    // already added for food; skip for beauty
  }

  items.push({ key: 'contact', label: 'setup.contact', done: contactFilled });
  items.push({ key: 'hours', label: 'setup.hours', done: hoursFilled });

  if (features.hasJobApplications) {
    const jobFormExists = await require('../../models/hr/JobFormSettings').exists({ tenantId });
    items.push({ key: 'jobForm', label: 'setup.jobForm', done: Boolean(jobFormExists) });
  }

  return items;
}

// ─── Niche-aware attention cards ─────────────────────────────────────────────
async function buildAttention(tenantId, settings) {
  const niche = settings?.niche || 'food';
  const today = new Date().toISOString().slice(0, 10);
  const attention = [];

  // ── Reservations / Appointments (common to food & beauty) ──
  if (niche === 'food' || niche === 'restaurant') {
    const pendingCount = await Reservation.countDocuments({ tenantId, date: today, status: 'pending' });
    if (pendingCount > 0) {
      attention.push({
        type: 'reservations',
        count: pendingCount,
        href: '/admin/reservations',
        icon: 'CalendarCheck',
      });
    }
  }

  if (niche === 'beauty') {
    const now = new Date();
    const endOfDay = new Date(now);
    endOfDay.setHours(23, 59, 59, 999);
    const pendingAppointments = await BeautyAppointment.countDocuments({
      tenantId,
      startAt: { $gte: now, $lte: endOfDay },
      status: 'pending',
    });
    if (pendingAppointments > 0) {
      attention.push({
        type: 'appointments',
        count: pendingAppointments,
        href: '/admin/reservations',
        icon: 'CalendarCheck',
      });
    }
  }

  // ── Orders ──
  if (niche === 'food' || niche === 'restaurant' || niche === 'ecommerce') {
    const pendingOrders = await Order.countDocuments({
      tenantId,
      status: { $in: ['pending_payment', 'paid', 'accepted'] },
    });
    if (pendingOrders > 0) {
      attention.push({
        type: 'orders',
        count: pendingOrders,
        href: '/admin/orders',
        icon: 'ClipboardList',
      });
    }
  }

  // ── Job applications ──
  const newApplications = await JobApplication.countDocuments({ tenantId, status: 'new' });
  if (newApplications > 0) {
    attention.push({
      type: 'applications',
      count: newApplications,
      href: '/admin/jobs',
      icon: 'Users',
    });
  }

  return attention;
}

// ─── Niche-aware stats cards ─────────────────────────────────────────────────
async function buildStats(tenantId, settings) {
  const niche = settings?.niche || 'food';
  const today = new Date().toISOString().slice(0, 10);
  const stats = [];

  if (niche === 'food' || niche === 'restaurant') {
    const menuCount = await MenuItem.countDocuments({ tenantId, status: { $ne: 'hidden' } });
    const todayReservations = await Reservation.countDocuments({ tenantId, date: today });
    const totalReservations = await Reservation.countDocuments({ tenantId });
    stats.push(
      { key: 'menuItems', value: menuCount, icon: 'UtensilsCrossed' },
      { key: 'todayBookings', value: todayReservations, icon: 'CalendarCheck' },
      { key: 'totalBookings', value: totalReservations, icon: 'ClipboardList' },
    );
  }

  if (niche === 'beauty') {
    const serviceCount = await BeautyService.countDocuments({ tenantId });
    const masterCount = await BeautyMaster.countDocuments({ tenantId });
    const now = new Date();
    const endOfDay = new Date(now);
    endOfDay.setHours(23, 59, 59, 999);
    const todayAppointments = await BeautyAppointment.countDocuments({
      tenantId,
      startAt: { $gte: now, $lte: endOfDay },
    });
    stats.push(
      { key: 'services', value: serviceCount, icon: 'Sparkles' },
      { key: 'masters', value: masterCount, icon: 'Users2' },
      { key: 'todayAppointments', value: todayAppointments, icon: 'CalendarCheck' },
    );
  }

  if (niche === 'ecommerce') {
    const productCount = await MenuItem.countDocuments({ tenantId, status: { $ne: 'hidden' } });
    const totalOrders = await Order.countDocuments({ tenantId });
    const todayOrders = await Order.countDocuments({ tenantId, createdAt: { $gte: today } });
    stats.push(
      { key: 'products', value: productCount, icon: 'Package' },
      { key: 'todayOrders', value: todayOrders, icon: 'ShoppingCart' },
      { key: 'totalOrders', value: totalOrders, icon: 'ClipboardList' },
    );
  }

  if (niche === 'auto') {
    const listingCount = await MenuItem.countDocuments({ tenantId, status: { $ne: 'hidden' } });
    const totalApplications = await JobApplication.countDocuments({ tenantId });
    stats.push(
      { key: 'listings', value: listingCount, icon: 'Package' },
      { key: 'submissions', value: totalApplications, icon: 'ClipboardList' },
    );
  }

  return stats;
}

// ─── Activity feed (recent events across all niches) ─────────────────────────
async function buildActivity(tenantId, settings) {
  const niche = settings?.niche || 'food';
  const activity = [];
  const limit = 6;

  if (niche === 'food' || niche === 'restaurant') {
    const recentReservations = await Reservation.find({ tenantId })
      .sort({ createdAt: -1 })
      .limit(3)
      .lean();
    recentReservations.forEach(r => {
      activity.push({
        type: 'reservation',
        text: `${r.name} — ${r.date} ${r.time}`,
        time: r.createdAt,
        status: r.status,
        href: '/admin/reservations',
      });
    });
  }

  if (niche === 'beauty') {
    const recentAppointments = await BeautyAppointment.find({ tenantId })
      .sort({ createdAt: -1 })
      .limit(3)
      .lean();
    recentAppointments.forEach(a => {
      const guestName = a.guestInfo?.name || 'Guest';
      const dateStr = new Date(a.startAt).toLocaleDateString();
      activity.push({
        type: 'appointment',
        text: `${guestName} — ${dateStr}`,
        time: a.createdAt,
        status: a.status,
        href: '/admin/reservations',
      });
    });
  }

  if (niche === 'food' || niche === 'restaurant' || niche === 'ecommerce') {
    const recentOrders = await Order.find({ tenantId })
      .sort({ createdAt: -1 })
      .limit(3)
      .lean();
    recentOrders.forEach(o => {
      activity.push({
        type: 'order',
        text: `${o.customer?.name || 'Customer'} — ${o.pricing?.total ?? ''} ${settings?.primaryCurrency || 'PLN'}`,
        time: o.createdAt,
        status: o.status,
        href: '/admin/orders',
      });
    });
  }

  // Always include job applications
  const recentApps = await JobApplication.find({ tenantId })
    .sort({ createdAt: -1 })
    .limit(2)
    .lean();
  recentApps.forEach(a => {
    const applicantName = a.fields?.get?.('name') || a.fields?.name || 'Applicant';
    activity.push({
      type: 'application',
      text: applicantName,
      time: a.createdAt,
      status: a.status,
      href: '/admin/jobs',
    });
  });

  // Sort by time descending and limit
  activity.sort((a, b) => new Date(b.time) - new Date(a.time));
  return activity.slice(0, limit);
}

// ─── Main route ──────────────────────────────────────────────────────────────
router.get('/', authTenant, async (req, res) => {
  try {
    const tenantId = req.tenantId;

    const settings = await TenantSettings.findOne({ tenantId })
      .select('niche features phone address email hours primaryCurrency')
      .lean();

    const branch = await Branch.findOne({ tenantId }).lean();

    const [attention, stats, checklist, activity] = await Promise.all([
      buildAttention(tenantId, settings),
      buildStats(tenantId, settings),
      buildChecklist(tenantId, settings, branch),
      buildActivity(tenantId, settings),
    ]);

    const doneCount = checklist.filter(i => i.done).length;
    const progress = checklist.length > 0
      ? Math.round((doneCount / checklist.length) * 100)
      : 100;

    res.json({
      attention,
      stats,
      checklist,
      activity,
      setupProgress: progress,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;