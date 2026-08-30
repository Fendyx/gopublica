/**
 * Tenant Telegram Bot Webhook Handler
 *
 * Receives updates from Telegram (via webhook) and processes them.
 * Registered in config/app.js BEFORE express.json() to receive raw body.
 * Uses express.raw() to parse JSON body like Stripe webhook.
 */

const express = require('express');
const { handleUpdate } = require('../../services/notifications/tenantTelegram');

// Parse raw JSON body (like Stripe webhook)
const rawBodyParser = express.raw({ type: 'application/json' });

module.exports = async (req, res) => {
  // Parse raw body first
  await new Promise((resolve, reject) => {
    rawBodyParser(req, res, (err) => {
      if (err) reject(err);
      else resolve();
    });
  });

  try {
    // Verify secret token if configured
    const secret = process.env.TENANT_TELEGRAM_WEBHOOK_SECRET;
    if (secret) {
      const receivedSecret = req.headers['x-telegram-bot-api-secret-token'];
      if (receivedSecret !== secret) {
        console.warn('⚠️ Tenant Telegram webhook: invalid secret token');
        return res.sendStatus(401);
      }
    }

    // Parse JSON body
    let update;
    try {
      update = JSON.parse(req.body.toString('utf8'));
    } catch (parseErr) {
      console.error('❌ Tenant Telegram webhook: failed to parse JSON body', parseErr.message);
      return res.sendStatus(200);
    }

    // Process the update
    await handleUpdate(update);

    // Always return 200 to prevent Telegram retries
    res.sendStatus(200);
  } catch (err) {
    console.error('❌ Tenant Telegram webhook error:', err.message);
    // Still return 200 to prevent Telegram retries
    res.sendStatus(200);
  }
};