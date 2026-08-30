const webpush = require('web-push');
const PushSubscription = require('../../models/communication/PushSubscription');

/**
 * WebPush subscription management helpers.
 * Centralizes push notification subscription logic.
 */

/**
 * Save or update a push subscription for a tenant.
 * @param {string} tenantId
 * @param {object} subscription - WebPush subscription object
 * @returns {Promise<object>} Saved subscription
 */
async function saveSubscription(tenantId, subscription) {
  return PushSubscription.findOneAndUpdate(
    { tenantId, endpoint: subscription.endpoint },
    { tenantId, endpoint: subscription.endpoint, subscription },
    { upsert: true, new: true }
  );
}

/**
 * Delete a push subscription by endpoint.
 * @param {string} tenantId
 * @param {string} endpoint
 * @returns {Promise<DeleteResult>}
 */
async function deleteSubscription(tenantId, endpoint) {
  return PushSubscription.deleteOne({ tenantId, endpoint });
}

/**
 * Send a push notification to all subscriptions for a tenant.
 * @param {string} tenantId
 * @param {object} payload - Notification payload
 * @returns {Promise<void>}
 */
async function sendToTenant(tenantId, payload) {
  const subscriptions = await PushSubscription.find({ tenantId });
  const payloadStr = JSON.stringify(payload);

  const promises = subscriptions.map(async (sub) => {
    try {
      await webpush.sendNotification(sub.subscription, payloadStr);
    } catch (err) {
      console.error(`Push notification failed for tenant ${tenantId}:`, err.message);
      // Clean up expired subscriptions
      if (err.statusCode === 410) {
        await deleteSubscription(tenantId, sub.endpoint);
      }
    }
  });

  await Promise.allSettled(promises);
}

module.exports = {
  saveSubscription,
  deleteSubscription,
  sendToTenant,
};