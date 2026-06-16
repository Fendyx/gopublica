const express    = require('express');
const router     = express.Router();
const Stripe     = require('stripe')(process.env.STRIPE_SECRET_KEY);
const TenantUser = require('../../models/TenantUser');   // было '../models/TenantUser' — неверно
const Order      = require('../../models/Order');
const Customer   = require('../../models/Customer');

router.post('/', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = Stripe.webhooks.constructEvent(
      req.body, sig, process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    switch (event.type) {

      // ----------------- Заказы (онлайн-меню) -----------------
      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object;
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

            // Уведомление ресторану
            require('../../services/orderNotification').notifyNewOrder(order);
            console.log(`✅ Order ${order._id} paid, waiting confirmation`);
          }
        }
        break;
      }

      // ----------------- Подписки (существующая логика) -----------------
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
            subscriptionPlan:     'basic',
            currentPeriodEnd:     periodEnd,
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
            currentPeriodEnd:     null,
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