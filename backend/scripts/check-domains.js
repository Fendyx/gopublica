const mongoose = require('mongoose');
require('dotenv').config();
const TenantSettings = require('../models/TenantSettings');

async function check() {
  await mongoose.connect(process.env.MONGO_URI);
  const settings = await TenantSettings.find({
    $or: [
      { domain: { $ne: null, $ne: '' } },
      { aliases: { $ne: [], $exists: true } },
    ],
  }).lean();
  settings.forEach(s => console.log(
    s.tenantId,
    '| domain:', s.domain || '(none)',
    '| aliases:', (s.aliases || []).join(', ') || '(none)',
    '|', s.businessName
  ));
  await mongoose.disconnect();
}
check();