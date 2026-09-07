const Stripe = require('stripe');

/**
 * Initialize Stripe instance from environment variables.
 * @returns {Stripe}
 */
module.exports = function initStripe() {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    console.warn('⚠️  STRIPE_SECRET_KEY not configured - Stripe operations will fail');
  }
  return Stripe(secretKey || '');
};
