const express = require('express');
const cors = require('cors');

/**
 * Configure Express app with global middleware.
 * Called from index.js after creating the app instance.
 */
module.exports = function configureApp(app) {
  // ── Trust proxy (required for req.ip behind Render/Heroku) ──
  app.set('trust proxy', 1);

  // ── Настройки CORS ───────────────────────────────────
  app.use(cors({
    origin: (origin, callback) => {
      // В SaaS-архитектуре мы динамически разрешаем ЛЮБЫЕ домены
      callback(null, true);
    },
    credentials: true,
  }));

  // Вебхук Страйпа должен быть ДО express.json(), чтобы получать сырой body
  app.use('/api/stripe/webhook', require('../routes/stripe/webhook'));

  // Tenant Telegram webhook — тоже до express.json() для raw body
  app.use('/api/telegram/tenant/webhook', require('../routes/telegram/tenantWebhook'));

  app.use(express.json({ limit: '10mb' }));

  // ── Handle JSON parse errors from express.json() ──
  app.use((err, req, res, next) => {
    if (err.type === 'entity.parse.failed') {
      console.error('🔴 [MIDDLEWARE] JSON parse error:', err.message);
      return res.status(400).json({ error: 'Invalid JSON in request body' });
    }
    if (err.type === 'entity.too.large') {
      console.error('🔴 [MIDDLEWARE] Request body too large:', err.message);
      return res.status(413).json({ error: 'Request body too large' });
    }
    next(err);
  });

  // ── GDPR: Attach consent context (IP, User-Agent, timestamp) ──
  app.use(require('../middleware/common/extractConsent'));
};
