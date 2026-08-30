const express = require('express');
const cors = require('cors');

/**
 * Configure Express app with global middleware.
 * Called from index.js after creating the app instance.
 */
module.exports = function configureApp(app) {
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

  app.use(express.json());
};
