const express = require('express');
const router = express.Router();
const TenantUser = require('../../../models/TenantUser');

function sanitizeUser(user) {
  const obj = user.toObject ? user.toObject() : user;
  delete obj.passwordHash;
  return obj;
}

/**
 * GET /api/gopublica/tenants/users?tenantId=
 * List all TenantUsers for a specific tenant.
 */
router.get('/', async (req, res) => {
  try {
    const { tenantId } = req.query;
    if (!tenantId) return res.status(400).json({ error: 'tenantId is required' });
    const users = await TenantUser.find({ tenantId }).select('-passwordHash').sort({ createdAt: -1 }).lean();
    res.json(users.map(sanitizeUser));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
