const mongoose = require('mongoose');
const Branch = require('../models/Branch');

/**
 * Helper: check if a string is a valid MongoDB ObjectId (24-char hex)
 */
function isValidObjectId(str) {
  return mongoose.Types.ObjectId.isValid(str) && /^[0-9a-fA-F]{24}$/.test(str);
}

/**
 * checkBranch middleware
 *
 * Resolves a branch from the request using either:
 *   - branchId (MongoDB _id as string) — via req.params.branchId, req.body.branchId, or req.query.branchId
 *   - branchSlug — via req.params.branchSlug, req.body.branchSlug, or req.query.branchSlug
 *
 * If branchId is provided but is not a valid ObjectId, it is treated as a slug.
 *
 * Sets req.branch to the resolved Branch document (or null if none provided).
 * Requires req.tenantId to be set by a prior middleware (e.g., authTenant or resolveTenant).
 */
module.exports = async function checkBranch(req, res, next) {
  const branchId = req.params.branchId || (req.body && req.body.branchId) || req.query.branchId;
  const branchSlug = req.params.branchSlug || (req.body && req.body.branchSlug) || req.query.branchSlug;

  if (!branchId && !branchSlug) {
    req.branch = null;
    return next();
  }

  try {
    let branch;
    if (branchId) {
      // If branchId is not a valid ObjectId, treat it as a slug
      if (!isValidObjectId(branchId)) {
        branch = await Branch.findOne({ slug: branchId, tenantId: req.tenantId });
      } else {
        branch = await Branch.findOne({ _id: branchId, tenantId: req.tenantId });
      }
    } else if (branchSlug) {
      branch = await Branch.findOne({ slug: branchSlug, tenantId: req.tenantId });
    }

    if (!branch) {
      return res.status(403).json({ error: 'Access denied to this branch' });
    }
    req.branch = branch;
    next();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};