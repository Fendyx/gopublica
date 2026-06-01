const Lead         = require('../models/lead');
const Client       = require('../models/client');
const Subscription = require('../models/Subscription');

async function convertLead(leadId, options = {}) {
  const lead = await Lead.findById(leadId)
    .populate('assignedTo', 'name');

  if (!lead) throw new Error('Lead not found');
  if (lead.status === 'Closed') throw new Error('Lead is already closed');

  const client = await Client.create({
    leadId:       lead._id,
    name:         lead.name,
    phone:        lead.phone,
    email:        options.email      || '',
    country:      options.country    || '',
    businessType: lead.businessType  || 'Other',
    websiteUrl:   options.websiteUrl || '',
    source:       lead.source        || '',
    // Сохраняем кто вёл лид — для расчёта заработка
    assignedTo:   lead.assignedTo?._id?.toString() || '',
    notes:        lead.comment       || '',
  });

  const nextBilling = new Date();
  nextBilling.setMonth(nextBilling.getMonth() + 1);

  const subscription = await Subscription.create({
    clientId:        client._id,
    plan:            options.plan   || 'Basic',
    amount:          options.amount || 29,
    nextBillingDate: nextBilling,
    includes: [
      'Hosting & SSL',
      'Daily backups (30 days)',
      'Security updates',
      'Uptime monitoring',
      'Up to 2h edits/month',
      'Monthly report',
    ],
  });

  await Lead.findByIdAndUpdate(leadId, { status: 'Closed' });

  return { client, subscription };
}

module.exports = convertLead;