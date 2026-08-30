/**
 * Fee calculation for online orders.
 * Computes platform fee, Stripe fee, service fee, and total.
 */

/**
 * Calculate all fees for an order.
 * @param {number} subtotal - Subtotal before fees
 * @param {number} deliveryFee - Delivery fee
 * @param {object} tenant - TenantSettings object (may be null/undefined)
 * @returns {object} { subtotal, deliveryFee, platformFee, stripeFee, serviceFee, total }
 */
function calculateFees(subtotal, deliveryFee, tenant) {
  const platformFeePercent = (tenant?.payments?.platformFeePercent ?? 5) / 100;
  const stripePct = (tenant?.payments?.stripeFeePercent ?? 3.25) / 100;
  const stripeFix = tenant?.payments?.stripeFeeFixed ?? 1.0;

  const baseAmount = subtotal + deliveryFee;
  const platformFee = Math.round(subtotal * platformFeePercent * 100) / 100;
  const stripeFee = Math.round((baseAmount * stripePct + stripeFix) * 100) / 100;
  const serviceFee = Math.round((platformFee + stripeFee) * 100) / 100;
  const total = Math.round((baseAmount + serviceFee) * 100) / 100;

  return {
    subtotal,
    deliveryFee,
    platformFee,
    stripeFee,
    serviceFee,
    total,
  };
}

module.exports = { calculateFees };
