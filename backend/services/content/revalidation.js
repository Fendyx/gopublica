const axios = require('axios');
const crypto = require('crypto');

const REVALIDATION_URL = process.env.NEXTJS_REVALIDATION_URL;
const REVALIDATION_SECRET = process.env.REVALIDATE_SECRET;

if (!REVALIDATION_URL || !REVALIDATION_SECRET) {
  console.warn(
    '⚠️ Revalidation not configured: missing NEXTJS_REVALIDATION_URL or REVALIDATE_SECRET'
  );
}

/**
 * Generate HMAC-SHA256 signature for a payload string.
 * @param {string} payloadString - JSON string of the payload
 * @returns {string} hex digest
 */
function signPayload(payloadString) {
  return crypto
    .createHmac('sha256', REVALIDATION_SECRET)
    .update(payloadString)
    .digest('hex');
}

/**
 * Send a revalidation webhook to the Next.js frontend.
 *
 * @param {Object} params
 * @param {string} params.tenantId - Required tenant identifier
 * @param {string} [params.branchId] - Optional branch identifier
 * @param {string[]} params.tags - Cache tags to invalidate (required)
 * @param {'create'|'update'|'delete'} params.action - Action type
 * @param {string} [params.model] - Model name for debugging
 * @param {string} [params.entityId] - Specific entity ID/slug
 * @returns {Promise<{success?: boolean, error?: string, skipped?: boolean}>}
 */
async function triggerRevalidation({
  tenantId,
  branchId = null,
  tags,
  action,
  model = null,
  entityId = null,
}) {
  if (!REVALIDATION_URL || !REVALIDATION_SECRET) {
    console.log('🔔 Revalidation skipped (not configured)');
    return { skipped: true };
  }

  if (!tenantId || !tags || !Array.isArray(tags) || tags.length === 0) {
    console.error('❌ triggerRevalidation: tenantId and tags are required');
    return { error: 'Missing required params' };
  }

  const timestamp = new Date().toISOString();
  const payload = {
    tenantId,
    branchId,
    tags,
    action,
    model,
    entityId,
    timestamp,
  };

  const payloadString = JSON.stringify(payload);
  const signature = signPayload(payloadString);

  try {
    const response = await axios.post(REVALIDATION_URL, payloadString, {
      headers: {
        'Content-Type': 'application/json',
        'x-revalidation-signature': signature,
        'x-revalidation-timestamp': timestamp,
      },
      timeout: 5000, // 5s timeout — never block the API response
    });

    if (response.status === 200) {
      console.log(
        `✅ Revalidation sent: ${tags.join(', ')} (${action} on ${model}:${entityId})`
      );
      return { success: true };
    } else {
      console.error(
        `❌ Revalidation failed: HTTP ${response.status}`,
        response.data
      );
      return { error: `HTTP ${response.status}` };
    }
  } catch (err) {
    // Non-blocking: log but never throw — API response must not be delayed
    console.error('❌ Revalidation request failed:', err.message);
    return { error: err.message };
  }
}

module.exports = { triggerRevalidation, signPayload };