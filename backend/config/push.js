const webpush = require('web-push');

/**
 * Initialize WebPush VAPID keys from environment variables.
 */
module.exports = function initPush() {
  const vapidEmail = process.env.VAPID_EMAIL;
  const vapidPublic = process.env.VAPID_PUBLIC_KEY;
  const vapidPrivate = process.env.VAPID_PRIVATE_KEY;

  if (vapidEmail && vapidPublic && vapidPrivate) {
    webpush.setVapidDetails(
      vapidEmail,
      vapidPublic,
      vapidPrivate
    );
  } else {
    console.warn('⚠️  WebPush VAPID keys not configured — push notifications will not work');
  }
};
