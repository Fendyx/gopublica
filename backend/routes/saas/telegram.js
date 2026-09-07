/**
 * SaaS Admin API: Tenant Telegram Bot Management
 *
 * Endpoints for tenant admins to link/unlink Telegram and manage notification preferences.
 */

const express = require('express');
const router = express.Router();
const authTenant = require('../../middleware/auth/tenant');
const TenantUser = require('../../models/TenantUser');
const TenantSettings = require('../../models/TenantSettings');
const { generateLinkToken } = require('../../services/notifications/tenantTelegram');

// POST /api/saas/telegram/link-token
// Generate a one-time deep link token for the current TenantUser
// Token is short (32 chars base64url) to fit Telegram's 64-byte start parameter limit.
// Stored as raw plaintext (acceptable for short-lived single-use tokens).
router.post('/link-token', authTenant, async (req, res) => {
  try {
    const user = await TenantUser.findById(req.userId);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const { token, expiresAt, deepLink } = generateLinkToken(user._id);

    // Store raw token + expiry on user (short-lived single-use token, no need for bcrypt)
    user.telegramLinkToken = token;
    user.telegramLinkTokenExpiresAt = expiresAt;
    await user.save();

    res.json({ token, expiresAt, deepLink });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/saas/telegram/status
// Check if current user has Telegram linked
router.get('/status', authTenant, async (req, res) => {
  try {
    const user = await TenantUser.findById(req.userId).select('telegramChatId telegramLinkedAt');
    res.json({
      linked: !!user?.telegramChatId,
      chatId: user?.telegramChatId || null,
      linkedAt: user?.telegramLinkedAt || null,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/saas/telegram/unlink
// Unlink Telegram account
router.delete('/unlink', authTenant, async (req, res) => {
  try {
    await TenantUser.findByIdAndUpdate(req.userId, {
      $unset: {
        telegramChatId: 1,
        telegramLinkedAt: 1,
        telegramLinkToken: 1,
        telegramLinkTokenExpiresAt: 1,
      },
    });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/saas/telegram/preferences
// Get notification preferences - returns flat event flags for the frontend
router.get('/preferences', authTenant, async (req, res) => {
  try {
    const tenant = await TenantSettings.findOne({ tenantId: req.tenantId })
      .select('notifications.telegram')
      .lean();

    if (!tenant?.notifications?.telegram) {
      return res.json({
        enabled: false,
        newOrder: true,
        newReservation: true,
        newJobApplication: true,
        newPartnerRequest: true,
      });
    }

    const tg = tenant.notifications.telegram;
    res.json({
      enabled: !!tg.enabled,
      newOrder: tg.events?.newOrder ?? true,
      newReservation: tg.events?.newReservation ?? true,
      newJobApplication: tg.events?.newJobApplication ?? true,
      newPartnerRequest: tg.events?.newPartnerRequest ?? true,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/saas/telegram/preferences
// Update notification preferences
// Accepts flat event flags from frontend: { enabled, newOrder, newReservation, newJobApplication, newPartnerRequest }
router.put('/preferences', authTenant, async (req, res) => {
  try {
    const { enabled, newOrder, newReservation, newJobApplication, newPartnerRequest, branchOverrides } = req.body;

    const tenant = await TenantSettings.findOne({ tenantId: req.tenantId });
    if (!tenant) return res.status(404).json({ error: 'Tenant not found' });

    // Initialize telegram config if missing
    if (!tenant.notifications) tenant.notifications = {};
    if (!tenant.notifications.telegram) {
      tenant.notifications.telegram = {
        enabled: false,
        events: {
          newOrder: true,
          newReservation: true,
          newJobApplication: true,
          newPartnerRequest: true,
        },
        branchOverrides: [],
      };
    }
    if (!tenant.notifications.telegram.events) {
      tenant.notifications.telegram.events = {
        newOrder: true,
        newReservation: true,
        newJobApplication: true,
        newPartnerRequest: true,
      };
    }

    // Update enabled flag
    if (typeof enabled === 'boolean') {
      tenant.notifications.telegram.enabled = enabled;
    }

    // Update event flags (flat from frontend → nested in DB)
    if (typeof newOrder === 'boolean') {
      tenant.notifications.telegram.events.newOrder = newOrder;
    }
    if (typeof newReservation === 'boolean') {
      tenant.notifications.telegram.events.newReservation = newReservation;
    }
    if (typeof newJobApplication === 'boolean') {
      tenant.notifications.telegram.events.newJobApplication = newJobApplication;
    }
    if (typeof newPartnerRequest === 'boolean') {
      tenant.notifications.telegram.events.newPartnerRequest = newPartnerRequest;
    }

    // Update branch overrides
    if (Array.isArray(branchOverrides)) {
      tenant.notifications.telegram.branchOverrides = branchOverrides.map(override => ({
        branchId: override.branchId,
        events: {
          newOrder: Boolean(override.events?.newOrder),
          newReservation: Boolean(override.events?.newReservation),
          newJobApplication: Boolean(override.events?.newJobApplication),
          newPartnerRequest: Boolean(override.events?.newPartnerRequest),
        },
      }));
    }

    await tenant.save();
    res.json({
      enabled: tenant.notifications.telegram.enabled,
      newOrder: tenant.notifications.telegram.events.newOrder,
      newReservation: tenant.notifications.telegram.events.newReservation,
      newJobApplication: tenant.notifications.telegram.events.newJobApplication,
      newPartnerRequest: tenant.notifications.telegram.events.newPartnerRequest,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;