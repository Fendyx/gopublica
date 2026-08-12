const mongoose = require('mongoose');
require('dotenv').config();
const TenantSettings = require('../models/TenantSettings');

async function check() {
  await mongoose.connect(process.env.MONGO_URI);
  const settings = await TenantSettings.find({ domain: { $ne: null, $ne: '' } }).lean();
  settings.forEach(s => console.log(s.tenantId, '|', s.domain, '|', s.businessName));
  await mongoose.disconnect();
}
check();