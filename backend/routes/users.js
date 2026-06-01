const express = require('express');
const router  = express.Router();
const User    = require('../models/user');
const Lead    = require('../models/lead');
const auth    = require('../middleware/auth');
const checkRole = require('../middleware/checkRole');

const ADMIN_ROLES = ['admin', 'superadmin'];

// GET /api/users — список всех админов (для дропдауна assignedTo)
router.get('/', auth, checkRole(ADMIN_ROLES), async (req, res) => {
  try {
    const users = await User.find(
      { role: { $in: ADMIN_ROLES } },
      'name email role'
    ).sort({ name: 1 });

    res.json(users);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching users', error: err.message });
  }
});

// GET /api/users/me/stats — статистика по моим лидам
router.get('/me/stats', auth, checkRole(ADMIN_ROLES), async (req, res) => {
  try {
    const userId = req.user.id;

    const myLeads = await Lead.find({ assignedTo: userId })
      .populate('assignedTo', 'name')
      .sort({ createdAt: -1 });

    const leadStats = {
      total:      myLeads.length,
      new:        myLeads.filter(l => l.status === 'New').length,
      inProgress: myLeads.filter(l => l.status === 'In Progress').length,
      closed:     myLeads.filter(l => l.status === 'Closed').length,
      rejected:   myLeads.filter(l => l.status === 'Rejected').length,
    };

    res.json({
      leads: myLeads,
      leadStats,
    });
  } catch (err) {
    res.status(500).json({ message: 'Error fetching stats', error: err.message });
  }
});

module.exports = router;