const express    = require('express');
const router     = express.Router();
const { Stripe, constructWebhookEvent } = require('../../services/payments/stripe');
const TenantUser = require('../../models/TenantUser');
const Order      = require('../../models/food/Order');
const Customer   = require('../../models/Customer');
const TenantSettings = require('../../models/TenantSettings');
const { createFurgonetkaShipment } = require('../../services/external/furgonetka');
const { reserveTickets } = require('../../services/booking/tickets');

router.post('/', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = await constructWebhookEvent(req.body, sig);
  } catch (err) {
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    switch (event.type) {

      // ----------------- Заказы (онлайн-меню) -----------------
      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object;

        // ── Platform Marketplace Orders ──
        if (paymentIntent.metadata?.type === 'platform_order' && paymentIntent.metadata?.platformOrderId) {
          const PlatformOrder = require('../../models/platform/PlatformOrder');
          const { createPlatformFurgonetkaShipment } = require('../../services/platform/furgonetka');
          const platformOrder = await PlatformOrder.findById(paymentIntent.metadata.platformOrderId);
          if (platformOrder && platformOrder.paymentStatus !== 'paid') {
            platformOrder.paymentStatus = 'paid';
            platformOrder.stripePaymentIntentId = paymentIntent.id;
            await platformOrder.save();
            console.log(`✅ Platform order ${platformOrder._id} marked as paid`);

            // Create Furgonetka shipment for parcel locker deliveries
            if (platformOrder.fulfillment?.parcelLocker?.enabled) {
              await createPlatformFurgonetkaShipment(platformOrder);
            }
          }
          break;
        }

        // ── Tenant food/beauty orders ──
        if (paymentIntent.metadata?.orderId) {
          const order = await Order.findById(paymentIntent.metadata.orderId);
          if (order && order.status === 'pending_payment') {
            order.status = 'paid';
            order.payment.paymentIntentId = paymentIntent.id;
            if (paymentIntent.charges?.data?.[0]) {
              order.payment.stripeFee = paymentIntent.charges.data[0].balance_transaction
                ? paymentIntent.charges.data[0].balance_transaction.fee / 100
                : 0;
            }
            await order.save();

            await Customer.findByIdAndUpdate(order.customerId, {
              $inc: { ordersCount: 1, totalSpent: order.pricing.total },
            });

            // ── Pattern A: Atomic ticket stock deduction on payment success ───
            for (const item of order.items) {
              if (item.itemType === 'ticket' && item.ticketMeta?.eventId) {
                const result = await reserveTickets(
                  item.ticketMeta.eventId,
                  item.quantity,
                  order.tenantId
                );
                if (!result.success) {
                  console.error(
                    `❌ Failed to reserve tickets for order ${order._id}, event ${item.ticketMeta.eventId}: ${result.error}`
                  );
                  // Note: We don't fail the webhook here — the order is already paid.
                  // Manual intervention or a reconciliation job would be needed.
                } else {
                  console.log(
                    `✅ Reserved ${item.quantity} tickets for event ${item.ticketMeta.eventId} (order ${order._id})`
                  );
                }
              }
            }

            // Уведомление ресторану
            require('../../services/orderNotification').notifyNewOrder(order);

            // Автоматическое создание накладной Фургонетки
            // (пропускаем цифровые заказы — физическая доставка им не нужна)
            const tenant = await TenantSettings.findOne({ tenantId: order.tenantId });
            if (tenant && order.fulfillment?.type !== 'digital') {
              await createFurgonetkaShipment(order, tenant);
            } else if (order.fulfillment?.type === 'digital') {
              console.log(`⏭️ Skipping Furgonetka shipment for digital order ${order._id}`);
            }

            console.log(`✅ Order ${order._id} paid and processed`);
          }
        }
        break;
      }

      // ----------------- Subscriptions -----------------
      case 'checkout.session.completed': {
        const session = event.data.object;
        const sub     = await Stripe.subscriptions.retrieve(session.subscription);

        let user = null;
        if (sub.metadata?.userId) {
          user = await TenantUser.findById(sub.metadata.userId);
        }
        if (!user && session.customer) {
          user = await TenantUser.findOne({ stripeCustomerId: session.customer });
        }

        if (user) {
          const periodEnd = sub.current_period_end ? new Date(sub.current_period_end * 1000) : null;

          await TenantUser.findByIdAndUpdate(user._id, {
            stripeSubscriptionId: sub.id,
            subscriptionStatus:   sub.status,
            subscriptionPlan:    'basic',
            currentPeriodEnd:    periodEnd,
          });
          console.log(`✅ Subscription updated for user ${user.email}: ${sub.status}`);
        } else {
          console.warn('⚠️ checkout.session.completed: user not found', session.customer);
        }
        break;
      }

      case 'customer.subscription.updated': {
        const sub  = event.data.object;
        let user   = null;
        if (sub.metadata?.userId) {
          user = await TenantUser.findById(sub.metadata.userId);
        }
        if (!user) {
          user = await TenantUser.findOne({ stripeCustomerId: sub.customer });
        }
        if (user) {
          const periodEnd = sub.current_period_end ? new Date(sub.current_period_end * 1000) : null;

          await TenantUser.findByIdAndUpdate(user._id, {
            subscriptionStatus: sub.status,
            currentPeriodEnd:   periodEnd,
          });
          console.log(`✅ Subscription status updated: ${sub.status}`);
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const sub  = event.data.object;
        let user   = null;
        if (sub.metadata?.userId) {
          user = await TenantUser.findById(sub.metadata.userId);
        }
        if (!user) {
          user = await TenantUser.findOne({ stripeCustomerId: sub.customer });
        }
        if (user) {
          await TenantUser.findByIdAndUpdate(user._id, {
            subscriptionStatus:   'canceled',
            stripeSubscriptionId: null,
            currentPeriodEnd:    null,
          });
          console.log(`✅ Subscription canceled for ${user.email}`);
        }
        break;
      }
    }
  } catch (err) {
    console.error('❌ Webhook handler error:', err.message);
  }

  res.json({ received: true });
});

module.exports = router;