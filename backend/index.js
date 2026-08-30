const path = require('path');
const express = require('express');
const fs = require('fs');
require('dotenv').config();

// ── Global process error handlers (prevent silent crashes) ──
process.on('unhandledRejection', (reason) => {
  console.error('🔴 Unhandled Rejection:', reason);
});
process.on('uncaughtException', (err) => {
  console.error('🔴 Uncaught Exception:', err);
  process.exit(1);
});

const app = express();
const PORT = 5000;

// ── Config modules ───────────────────────────────────
const configureApp = require('./config/app');
const connectDB = require('./config/db');
const initPush = require('./config/push');

// ── Initialize config ────────────────────────────────
configureApp(app);
initPush();

// ── Database connection ──────────────────────────────
connectDB();

// ── Initialize Tenant Telegram Bot Webhook ───────────
const { setWebhook } = require('./services/notifications/tenantTelegram');
setWebhook().catch(err => console.error('❌ Failed to set Tenant Telegram webhook:', err.message));

// ── Register all routes ──────────────────────────────
const { registerRoutes } = require('./routes');
registerRoutes(app);

// ── Запуск сервера ───────────────────────────────────
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));