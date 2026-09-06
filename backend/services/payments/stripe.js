const Stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

/**
 * Common Stripe helper functions.
 * Centralizes Stripe instance and shared operations.
 */

/**
 * Create a Stripe customer.
 * @param {object} params - { email, name, phone, metadata }
 * @returns {Promise<object>} Stripe customer object
 */
async function createCustomer(params) {
  return Stripe.customers.create(params);
}

/**
 * Update a Stripe customer.
 * @param {string} customerId - Stripe customer ID
 * @param {object} updates - Fields to update
 * @returns {Promise<object>} Updated Stripe customer
 */
async function updateCustomer(customerId, updates) {
  return Stripe.customers.update(customerId, updates);
}

/**
 * Create a tax ID for a customer.
 * @param {string} customerId - Stripe customer ID
 * @param {object} taxIdParams - { type, value }
 * @returns {Promise<object>} Created tax ID
 */
async function createTaxId(customerId, taxIdParams) {
  return Stripe.customers.createTaxId(customerId, taxIdParams);
}

/**
 * List tax IDs for a customer.
 * @param {string} customerId - Stripe customer ID
 * @returns {Promise<object>} List of tax IDs
 */
async function listTaxIds(customerId) {
  return Stripe.customers.listTaxIds(customerId);
}

/**
 * Delete a tax ID from a customer.
 * @param {string} customerId - Stripe customer ID
 * @param {string} taxIdId - Tax ID to delete
 * @returns {Promise<void>}
 */
async function deleteTaxId(customerId, taxIdId) {
  return Stripe.customers.deleteTaxId(customerId, taxIdId);
}

/**
 * Attach a payment method to a customer.
 * @param {string} paymentMethodId - Stripe payment method ID
 * @param {string} customerId - Stripe customer ID
 * @returns {Promise<object>} Attached payment method
 */
async function attachPaymentMethod(paymentMethodId, customerId) {
  return Stripe.paymentMethods.attach(paymentMethodId, { customer: customerId });
}

/**
 * Set the default payment method for a customer.
 * @param {string} customerId - Stripe customer ID
 * @param {string} paymentMethodId - Payment method ID
 * @returns {Promise<object>} Updated customer
 */
async function setDefaultPaymentMethod(customerId, paymentMethodId) {
  return Stripe.customers.update(customerId, {
    invoice_settings: { default_payment_method: paymentMethodId },
  });
}

/**
 * Create a checkout session for subscription.
 * @param {object} params - { customer, priceId, userId, tenantId, currency }
 * @returns {Promise<object>} Checkout session
 */
/**
 * Ensure a Stripe customer exists, creating a new one if the stored ID is stale.
 * @param {string} customerId - Stripe Customer ID from the database
 * @param {object} userData - User data for creating a new customer if needed
 * @returns {Promise<{ customer: object, isNew: boolean }>} The (possibly new) Stripe customer and a flag
 */
async function ensureValidCustomer(customerId, userData) {
  try {
    const customer = await Stripe.customers.retrieve(customerId);
    return { customer, isNew: false };
  } catch (err) {
    if (err.type === 'StripeInvalidRequestError' && err.statusCode === 404) {
      console.warn(
        `⚠️ Stripe customer ${customerId} not found — creating a new customer for ${userData.email}`
      );
      const customer = await Stripe.customers.create({
        email: userData.email,
        name: userData.companyName || userData.name,
        metadata: {
          userId: userData._id?.toString() || '',
          tenantId: userData.tenantId || '',
        },
      });
      return { customer, isNew: true };
    }
    throw err;
  }
}

async function createCheckoutSession(params) {
  const { customer, priceId, userId, tenantId, currency } = params;

  return Stripe.checkout.sessions.create({
    customer,
    line_items: [{ price: priceId, quantity: 1 }],
    mode: 'subscription',
    ...(currency ? { currency: currency.toLowerCase() } : {}),
    subscription_data: {
      trial_period_days: 30,
      metadata: { userId, tenantId: tenantId || '' },
    },
    success_url: `${process.env.FRONTEND_URL}/dashboard?success=true`,
    cancel_url: `${process.env.FRONTEND_URL}/pricing?canceled=true`,
  });
}

/**
 * Create a setup intent for future payments.
 * @param {string} customerId - Stripe customer ID
 * @param {string} userId - Internal user ID
 * @returns {Promise<object>} Setup intent
 */
async function createSetupIntent(customerId, userId) {
  return Stripe.setupIntents.create({
    customer: customerId,
    usage: 'off_session',
    metadata: { userId },
  });
}

/**
 * Cancel a subscription (at period end).
 * @param {string} subscriptionId - Stripe subscription ID
 * @returns {Promise<object>} Updated subscription
 */
async function cancelSubscription(subscriptionId) {
  return Stripe.subscriptions.update(subscriptionId, {
    cancel_at_period_end: true,
  });
}

/**
 * Retrieve a price by ID.
 * @param {string} priceId - Stripe price ID
 * @returns {Promise<object>} Price object with currency_options expanded
 */
async function retrievePrice(priceId) {
  return Stripe.prices.retrieve(priceId, {
    expand: ['currency_options'],
  });
}

/**
 * Retrieve a Stripe customer by ID.
 * @param {string} customerId - Stripe customer ID
 * @returns {Promise<object>} Stripe customer object
 */
async function retrieveCustomer(customerId) {
  return Stripe.customers.retrieve(customerId);
}

/**
 * Construct and verify a Stripe webhook event.
 * @param {Buffer} rawBody - Raw request body
 * @param {string} signature - Stripe signature header
 * @returns {Promise<object>} Verified event
 */
async function constructWebhookEvent(rawBody, signature) {
  return Stripe.webhooks.constructEvent(
    rawBody,
    signature,
    process.env.STRIPE_WEBHOOK_SECRET
  );
}

module.exports = {
  Stripe,
  ensureValidCustomer,
  createCustomer,
  updateCustomer,
  retrieveCustomer,
  createTaxId,
  listTaxIds,
  deleteTaxId,
  attachPaymentMethod,
  setDefaultPaymentMethod,
  createCheckoutSession,
  createSetupIntent,
  cancelSubscription,
  retrievePrice,
  constructWebhookEvent,
};
