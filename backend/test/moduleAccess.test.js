const test = require('node:test');
const assert = require('node:assert/strict');
const { buildTenantModuleAccess } = require('../services/moduleAccess');

test('auto niche disables orders and menu', () => {
  const access = buildTenantModuleAccess({ niche: 'auto' });

  assert.equal(access.orders, false);
  assert.equal(access.menu, false);
  assert.equal(access.canManageOrders, false);
  assert.equal(access.canManageMenu, false);
  assert.deepEqual(access.availableModules, ['reservations', 'gallery', 'news', 'jobs', 'sections']);
});

test('beauty niche disables orders but keeps menu', () => {
  const access = buildTenantModuleAccess({ niche: 'beauty' });

  assert.equal(access.orders, false);
  assert.equal(access.menu, true);
  assert.equal(access.canManageOrders, false);
  assert.equal(access.canManageMenu, true);
});

test('explicit module overrides can be applied', () => {
  const access = buildTenantModuleAccess({ niche: 'auto', moduleAccess: { orders: true } });

  assert.equal(access.orders, true);
  assert.equal(access.canManageOrders, true);
});
