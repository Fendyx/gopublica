const ConsentLog = require('../../models/audit/ConsentLog');

/**
 * Shared GDPR consent writer.
 *
 * Performs a dual-write:
 *   1. Returns a `_consent` sub-document to embed on the parent model.
 *   2. Inserts one ConsentLog row per consent type (terms, privacy, marketing).
 *
 * @param {Object} opts
 * @param {string} opts.entityType   – Mongoose model name ('Order', 'Reservation', …)
 * @param {ObjectId} opts.entityId   – _id of the parent document
 * @param {string} opts.tenantId     – tenant identifier
 * @param {ObjectId|null} opts.userId – CustomerUser._id if authenticated, null for guests
 * @param {Object} opts.consents     – { terms: bool, privacy: bool, marketing: bool }
 * @param {Object} opts.context      – { ip, userAgent, timestamp } from req.consentContext
 * @param {string} [opts.consentVersion='1.0'] – version of the consent text
 * @returns {Object} _consent sub-document to store on the parent model
 */
async function writeConsentLog({
  entityType,
  entityId,
  tenantId,
  userId = null,
  consents,
  context,
  consentVersion = '1.0',
}) {
  console.log('🟢 [CONSENT] writeConsentLog called:', { entityType, entityId: String(entityId), tenantId, userId, consents });
  if (!consents || (!consents.terms && !consents.privacy)) {
    console.log('🟢 [CONSENT] No consents to write, returning null');
    return null;
  }

  const { ip, userAgent, timestamp } = context || {};
  console.log('🟢 [CONSENT] context:', { ip, userAgent, timestamp });

  // 1. Build the embedded sub-document
  const _consent = {
    terms: Boolean(consents.terms),
    privacy: Boolean(consents.privacy),
    marketing: Boolean(consents.marketing),
    ip: ip || '',
    userAgent: userAgent || '',
    timestamp: timestamp || new Date(),
    version: consentVersion,
  };

  // 2. Build ConsentLog rows (one per consent type)
  const rows = [];
  for (const type of ['terms', 'privacy', 'marketing']) {
    if (consents[type] !== undefined) {
      rows.push({
        entityType,
        entityId,
        tenantId,
        userId,
        type,
        granted: Boolean(consents[type]),
        ip: ip || '',
        userAgent: userAgent || '',
        consentVersion,
      });
    }
  }

  if (rows.length > 0) {
    console.log('🟢 [CONSENT] Inserting', rows.length, 'ConsentLog rows:', JSON.stringify(rows));
    await ConsentLog.insertMany(rows).catch((err) => {
      console.error(`⚠️ ConsentLog write failed for ${entityType}:${entityId}`, err.message);
    });
  }

  console.log('🟢 [CONSENT] Returning _consent:', JSON.stringify(_consent));
  return _consent;
}

module.exports = { writeConsentLog };
