'use strict';

const Event = require('../../models/content/Event');

/**
 * ticketService.js
 *
 * Atomic ticket stock operations for the Event/Ticketed Articles feature.
 *
 * Design decisions:
 *  - Stock deduction uses MongoDB's atomic `findOneAndUpdate` with a
 *    `$gte` guard predicate. This guarantees that two concurrent buyers
 *    cannot both purchase the last ticket — only one update succeeds.
 *  - Pattern A: stock is RESERVED on checkout and CONFIRMED on Stripe
 *    payment success (payment_intent.succeeded). If payment fails or the
 *    order is cancelled, tickets are RELEASED back.
 */

// ───────────────────────────────────────────────────────
// READ-ONLY CHECK (checkout initialization / cart validation)
// ───────────────────────────────────────────────────────

/**
 * Check whether enough tickets are currently available for a purchase.
 * Does NOT modify stock — safe to call repeatedly from the frontend.
 *
 * @param {string} eventId   - Event _id
 * @param {number} quantity  - number of tickets requested
 * @param {string} tenantId  - tenant scope (security)
 * @returns {Promise<{ok: boolean, remaining: number, isSoldOut: boolean, error?: string}>}
 */
async function checkAvailability(eventId, quantity, tenantId) {
  if (!eventId || !quantity || quantity < 1) {
    return { ok: false, remaining: 0, isSoldOut: false, error: 'Invalid parameters' };
  }

  const event = await Event.findOne({ _id: eventId, tenantId }).lean();
  if (!event) {
    return { ok: false, remaining: 0, isSoldOut: false, error: 'Event not found' };
  }

  if (!event.isActive) {
    return { ok: false, remaining: 0, isSoldOut: false, error: 'Event is not active' };
  }

  const remaining = event.ticketsRemaining;
  const isSoldOut = remaining <= 0;

  if (isSoldOut) {
    return { ok: false, remaining: 0, isSoldOut: true, error: 'Event is sold out' };
  }

  if (remaining < quantity) {
    return { ok: false, remaining, isSoldOut: false, error: `Only ${remaining} tickets remaining` };
  }

  return { ok: true, remaining, isSoldOut: false };
}

// ───────────────────────────────────────────────────────
// ATOMIC STOCK DEDUCTION (Pattern A — called on payment success)
// ───────────────────────────────────────────────────────

/**
 * Atomically reserve/deduct tickets.
 *
 * Uses `findOneAndUpdate` with a `$gte` guard so MongoDB applies the
 * predicate + update as a single isolated write. If the guard fails
 * (not enough stock), the operation returns `null` and no order proceeds.
 *
 * @param {string} eventId
 * @param {number} quantity
 * @param {string} tenantId
 * @returns {Promise<{success: boolean, remaining?: number, error?: string}>}
 */
async function reserveTickets(eventId, quantity, tenantId) {
  if (!eventId || !quantity || quantity < 1) {
    return { success: false, error: 'Invalid parameters' };
  }

  try {
    const result = await Event.findOneAndUpdate(
      {
        _id: eventId,
        tenantId,
        isActive: true,
        ticketsRemaining: { $gte: quantity },
      },
      {
        $inc: {
          ticketsRemaining: -quantity,
          ticketsSold: quantity,
        },
      },
      { new: true }
    );

    if (!result) {
      // Either event doesn't exist, is inactive, or not enough stock
      const fallback = await Event.findOne({ _id: eventId, tenantId }).lean();
      if (!fallback) {
        return { success: false, error: 'Event not found' };
      }
      if (!fallback.isActive) {
        return { success: false, error: 'Event is not active' };
      }
      return {
        success: false,
        error: `Not enough tickets. Only ${fallback.ticketsRemaining} remaining.`,
      };
    }

    return { success: true, remaining: result.ticketsRemaining };
  } catch (err) {
    console.error('❌ ticketService.reserveTickets error:', err.message);
    return { success: false, error: err.message };
  }
}

// ───────────────────────────────────────────────────────
// COMPENSATING: RELEASE TICKS (cancellation / refund)
// ───────────────────────────────────────────────────────

/**
 * Release previously reserved tickets back to the pool.
 * Called when an order containing tickets is cancelled or refunded.
 *
 * @param {string} eventId
 * @param {number} quantity
 * @param {string} tenantId
 * @returns {Promise<{success: boolean, remaining?: number, error?: string}>}
 */
async function releaseTickets(eventId, quantity, tenantId) {
  if (!eventId || !quantity || quantity < 1) {
    return { success: false, error: 'Invalid parameters' };
  }

  try {
    const result = await Event.findOneAndUpdate(
      { _id: eventId, tenantId },
      {
        $inc: {
          ticketsRemaining: quantity,
          ticketsSold: -quantity,
        },
      },
      { new: true }
    );

    if (!result) {
      return { success: false, error: 'Event not found' };
    }

    return { success: true, remaining: result.ticketsRemaining };
  } catch (err) {
    console.error('❌ ticketService.releaseTickets error:', err.message);
    return { success: false, error: err.message };
  }
}

module.exports = {
  checkAvailability,
  reserveTickets,
  releaseTickets,
};