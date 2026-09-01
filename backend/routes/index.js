/**
 * Central route registration point.
 * All app.use() registrations + frontend serving + error handler.
 */

const path = require('path');
const express = require('express');
const fs = require('fs');

/**
 * Register all routes on the Express app.
 * @param {express.Express} app
 */
function registerRoutes(app) {
  // ── Импорт роутов ─────────────────────────────────────
  const jobsPublicRoutes = require('./public/jobs');
  const saasJobsRoutes = require('./saas/jobs');

  // Заказы (Чекаут)
  const ordersPublicRoutes = require('./orders/public');

  // Заказы (Личный кабинет клиента)
  const publicUserOrders = require('./public/orders');

  const publicProfileRoutes = require('./public/profile');

  // Branch Sections (SaaS admin + public)
  const saasBranchSectionsRoutes = require('./saas/branchSections');
  const publicBranchSectionsRoutes = require('./public/branchSections');

  // ── API Rooney ────────────────────────────────────────

  // Auth & Admins (GoPublica CRM)
  app.use('/api/auth', require('./gopublica/auth'));
  app.use('/api/users', require('./gopublica/users'));

  // Leads & Clients (GoPublica CRM)
  app.use('/api/leads', require('./gopublica/leads'));
  app.use('/api/clients', require('./gopublica/clients'));

  // SaaS (Рестораны)
  app.use('/api/saas/auth', require('./saas/auth'));
  app.use('/api/saas/settings', require('./saas/settings'));
  app.use('/api/saas/dashboard', require('./saas/dashboard'));
  app.use('/api/saas/menu', require('./saas/menu'));
  app.use('/api/saas/categories', require('./saas/categories'));
  app.use('/api/saas/reservations', require('./saas/reservations'));
  app.use('/api/saas/appointments', require('./saas/appointments'));
  app.use('/api/saas/orders', require('./saas/orders'));
  app.use('/api/saas/gallery', require('./saas/gallery'));
  app.use('/api/saas/branches', require('./saas/branches'));
  app.use('/api/saas/analytics', require('./saas/analytics'));
  app.use('/api/saas/push', require('./saas/push'));
  app.use('/api/saas/customers', require('./saas/customers'));
  app.use('/api/saas/jobs', saasJobsRoutes);
  app.use('/api/saas/sites', require('./saas/sites'));
  app.use('/api/saas/branch-sections', saasBranchSectionsRoutes);

  // Dynamic form submissions (SaaS admin)
  app.use('/api/saas/forms/submissions', require('./saas/formSubmissions'));
  app.use('/api/saas/articles', require('../middleware/auth/tenant'), require('./saas/articles'));
  app.use('/api/saas/events', require('../middleware/auth/tenant'), require('./saas/events'));

  // Tenant Telegram Bot (SaaS admin)
  app.use('/api/saas/telegram', require('./saas/telegram'));

  // Stripe (SaaS подписки) — mount all at /api/stripe so that
  // each router's own path segments form the correct final URL
  // e.g. router.post('/subscribe') → POST /api/stripe/subscribe
  app.use('/api/stripe', require('./stripe/checkout'));
  app.use('/api/stripe', require('./stripe/setupIntent'));
  app.use('/api/stripe', require('./stripe/subscribe'));
  app.use('/api/stripe', require('./stripe/cancel'));
  app.use('/api/stripe', require('./stripe/prices'));

  // Platform Marketplace (products, orders, news)
  app.use('/api/platform/products', require('./platform/products'));
  app.use('/api/platform/orders', require('./platform/orders'));
  app.use('/api/platform/news', require('./platform/news'));

  // Beauty (legacy standalone)
  app.use('/api/beauty/services', require('./beauty/services'));
  app.use('/api/beauty/appointments', require('./beauty/appointments'));
  app.use('/api/beauty/masters', require('./beauty/masters'));
  app.use('/api/beauty/categories', require('./beauty/categories'));

  // Beauty (SaaS admin)
  app.use('/api/saas/beauty/services', require('./saas/beauty/services'));
  app.use('/api/saas/beauty/masters', require('./saas/beauty/masters'));
  app.use('/api/saas/beauty/appointments', require('./saas/beauty/appointments'));

  // Beauty (Public)
  app.use('/api/public/beauty/services', require('./public/beauty/services'));
  app.use('/api/public/beauty/masters', require('./public/beauty/masters'));
  app.use('/api/public/beauty', require('./public/beauty/appointments'));

  // GoPublica CRM (other)
  app.use('/api/change-requests', require('./gopublica/changeRequests'));
  app.use('/api/portfolio', require('./gopublica/portfolio'));
  app.use('/api/projects', require('./gopublica/projects'));
  app.use('/api/demo-requests', require('./gopublica/demoRequests'));

  // Public auth
  app.use('/api/public/auth', require('./public/auth'));

  // ── Публичные роуты (Клиенты) ────────────────────────
  // Чекаут и оплата
  app.use('/api/orders/public', ordersPublicRoutes);
  // Личный кабинет и история заказов
  app.use('/api/public/orders', publicUserOrders);
  // Публичные вакансии
  app.use('/api/public/jobs', jobsPublicRoutes);

  app.use('/api/public/profile', publicProfileRoutes);

  // Публичные заявки на/demo ("Get a Free Demo" funnel)
  app.use('/api/public/demo-requests', require('./public/demoRequests'));

  // Branch Sections (public)
  app.use('/api/public/branch-sections', publicBranchSectionsRoutes);

  // Dynamic form submissions (public)
  app.use('/api/public/forms', require('./public/formSubmissions'));

  // Articles (public)
  app.use('/api/public/articles', require('./public/articles'));

  // Events (public)
  app.use('/api/public/events', require('./public/events'));

  // ── Раздача Фронтенда (прод) ─────────────────────────
  const frontendDistPath = path.join(__dirname, '../frontend/dist');

  // Проверяем, существует ли папка при запуске сервера
  if (!fs.existsSync(frontendDistPath)) {
    console.error(`\n❌ ВНИМАНИЕ: Папка ${frontendDistPath} НЕ НАЙДЕНА!`);
    console.error('❌ Скорее всего, поле "Root Directory" в Render не пустое!\n');
  } else {
    console.log(`\n✅ Папка с фронтендом успешно найдена: ${frontendDistPath}\n`);
  }

  // Раздаем статику (CSS, JS, картинки)
  app.use(express.static(frontendDistPath));

  // Для всех остальных запросов (роутинг React) отдаем index.html
  // Исключаем API-роуты, чтобы они обрабатывались роутерами выше
  app.get(/^(?!\/api\/).*$/, (req, res) => {
    const indexPath = path.join(frontendDistPath, 'index.html');
    if (!fs.existsSync(indexPath)) {
      return res.status(500).send('Frontend build not found on server');
    }
    res.sendFile(indexPath);
  });

  // ── 404 для несуществующих API-роутов (всегда JSON, не HTML) ──
  app.use('/api/{*path}', (req, res) => {
    res.status(404).json({ error: `Route not found: ${req.method} ${req.originalUrl}` });
  });

  // ── Глобальный обработчик ошибок API (Защита от падений) ──
  app.use((err, req, res, next) => {
    console.error('🔥 Ошибка на сервере:', err.message);
    if (req.path.startsWith('/api/')) {
      return res.status(500).json({
        success: false,
        message: 'Internal Server Error',
        error: err.message,
      });
    }
    next(err);
  });
}

module.exports = { registerRoutes };