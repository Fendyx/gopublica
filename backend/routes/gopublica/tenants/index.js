/**
 * GoPublica Admin → Tenant Manager routes.
 * All routes require jwt + checkRole(['admin', 'superadmin']).
 * tenantId is passed as query/body param (NOT from JWT) — allows superadmin to access any tenant.
 */
const express = require('express');
const router = express.Router();

const auth = require('../../../middleware/auth/jwt');
const checkRole = require('../../../middleware/auth/role');

router.use(auth);
router.use(checkRole(['admin', 'superadmin']));

router.use('/list', require('./allTenants'));
router.use('/settings', require('./settings'));
router.use('/branches', require('./branches'));
router.use('/menu', require('./menu'));
router.use('/categories', require('./categories'));
router.use('/orders', require('./orders'));
router.use('/customers', require('./customers'));
router.use('/reservations', require('./reservations'));
router.use('/staff', require('./staff'));
router.use('/gallery', require('./gallery'));
router.use('/articles', require('./articles'));
router.use('/users', require('./users'));
router.use('/subscriptions', require('./subscriptions'));
router.use('/sites', require('./sites'));
router.use('/analytics', require('./analytics'));
router.use('/beauty', require('./beauty'));

module.exports = router;
