const express = require('express');
const router  = express.Router();
const User    = require('../models/user');
const Lead    = require('../models/lead');
const Client  = require('../models/client');
const Subscription = require('../models/Subscription');
const auth    = require('../middleware/auth');
const checkRole = require('../middleware/checkRole');

const ADMIN_ROLES = ['admin', 'superadmin'];

// Доли заработка
const ADMIN_DEAL_CUT        = 0.40; // 40% с закрытой сделки
const ADMIN_SUBSCRIPTION_CUT = 0.50; // 50% с подписки

// GET /api/users — список всех админов (для дропдауна assignedTo)
router.get('/', auth, checkRole(ADMIN_ROLES), async (req, res) => {
  try {
    const users = await User.find(
      { role: { $in: ADMIN_ROLES } },
      'name email role' // только нужные поля, без пароля
    ).sort({ name: 1 });

    res.json(users);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching users', error: err.message });
  }
});

// GET /api/users/me/stats — мой профиль + заработок
router.get('/me/stats', auth, checkRole(ADMIN_ROLES), async (req, res) => {
  try {
    const userId = req.user.id;

    // Мои лиды
    const myLeads = await Lead.find({ assignedTo: userId })
      .populate('assignedTo', 'name')
      .sort({ createdAt: -1 });

    // Статистика по лидам
    const leadStats = {
      total:      myLeads.length,
      new:        myLeads.filter(l => l.status === 'New').length,
      inProgress: myLeads.filter(l => l.status === 'In Progress').length,
      closed:     myLeads.filter(l => l.status === 'Closed').length,
      rejected:   myLeads.filter(l => l.status === 'Rejected').length,
    };

    // Заработок с закрытых сделок
    const closedLeads = myLeads.filter(l => l.status === 'Closed');
    const totalDealsRevenue = closedLeads.reduce((sum, l) => sum + (l.price || 0), 0);
    const myDealsEarnings   = Math.round(totalDealsRevenue * ADMIN_DEAL_CUT);

    // Мои клиенты (конвертированные из моих лидов)
    const myLeadIds = myLeads.map(l => l._id);
    const myClients = await Client.find({
      leadId: { $in: myLeadIds },
      status: 'active',
    });

    // Заработок с подписок
    const myClientIds = myClients.map(c => c._id);
    const mySubs = await Subscription.find({
      clientId: { $in: myClientIds },
      status: 'active',
    });

    const totalSubsRevenue  = mySubs.reduce((sum, s) => sum + (s.amount || 0), 0);
    const mySubsEarnings    = Math.round(totalSubsRevenue * ADMIN_SUBSCRIPTION_CUT * 100) / 100;

    // Итого мой заработок
    const totalMyEarnings = myDealsEarnings + mySubsEarnings;

    res.json({
      leads:   myLeads,
      clients: myClients,

      leadStats,

      earnings: {
        // Сделки
        dealsRevenue:    totalDealsRevenue,   // полная сумма сделок
        dealsCut:        ADMIN_DEAL_CUT,      // 0.40
        dealsEarnings:   myDealsEarnings,     // моя доля

        // Подписки
        subsMonthly:     totalSubsRevenue,    // полная сумма подписок в месяц
        subsCut:         ADMIN_SUBSCRIPTION_CUT, // 0.50
        subsEarnings:    mySubsEarnings,      // моя доля в месяц

        // Итого
        total:           totalMyEarnings,
      },
    });
  } catch (err) {
    res.status(500).json({ message: 'Error fetching stats', error: err.message });
  }
});

module.exports = router;