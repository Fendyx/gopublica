const Branch = require('../models/Branch');

module.exports = async function checkBranch(req, res, next) {
  const branchId = req.params.branchId || req.body.branchId || req.query.branchId;
  if (!branchId) {
    req.branch = null;
    return next();
  }
  try {
    const branch = await Branch.findOne({ _id: branchId, tenantId: req.tenantId });
    if (!branch) {
      return res.status(403).json({ error: 'Access denied to this branch' });
    }
    req.branch = branch;
    next();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};