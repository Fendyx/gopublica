const express    = require('express');
const router     = express.Router();
const Stripe     = require('stripe')(process.env.STRIPE_SECRET_KEY);
const TenantUser = require('../../models/TenantUser');
const authTenant = require('../../middleware/authTenant');

router.post('/subscribe', authTenant, async (req, res) => {
  try {
    const { paymentMethodId, priceId, companyName, vatId } = req.body;

    const user = await TenantUser.findById(req.userId);
    if (!user) return res.status(404).json({ error: 'Пользователь не найден' });
    if (!user.stripeCustomerId) {
      return res.status(400).json({ error: 'Stripe customer не найден' });
    }

    // Привязываем PaymentMethod к Customer
    await Stripe.paymentMethods.attach(paymentMethodId, {
      customer: user.stripeCustomerId,
    });

    // Обновляем данные компании и VAT в Stripe Customer, если они переданы
    const customerUpdateData = {};
    if (companyName && companyName !== user.companyName) {
      customerUpdateData.name = companyName;
    }
    if (vatId !== undefined && vatId !== user.vatId) {
      // Удаляем старый VAT (если был)
      const existingTaxIds = await Stripe.customers.listTaxIds(user.stripeCustomerId);
      for (const taxId of existingTaxIds.data) {
        if (taxId.type === 'eu_vat') {
          await Stripe.customers.deleteTaxId(user.stripeCustomerId, taxId.id);
        }
      }
      // Добавляем новый, если не пустой
      if (vatId) {
        await Stripe.customers.createTaxId(user.stripeCustomerId, {
          type: 'eu_vat',
          value: vatId,
        });
      }
    }
    if (Object.keys(customerUpdateData).length > 0) {
      await Stripe.customers.update(user.stripeCustomerId, customerUpdateData);
    }

    // Устанавливаем PaymentMethod как дефолтный для инвойсов
    await Stripe.customers.update(user.stripeCustomerId, {
      invoice_settings: {
        default_payment_method: paymentMethodId,
      },
    });

    // Создаём подписку с триалом
    const subscription = await Stripe.subscriptions.create({
      customer: user.stripeCustomerId,
      items: [{ price: priceId }],
      trial_period_days: 30,
      default_payment_method: paymentMethodId,
      metadata: {
        userId: user._id.toString(),
        tenantId: user.tenantId || '',
      },
    });

    // Обновляем локального пользователя
    user.stripeSubscriptionId = subscription.id;
    user.subscriptionStatus = subscription.status;
    user.subscriptionPlan = 'basic'; // или определяй по priceId
    user.currentPeriodEnd = subscription.current_period_end
      ? new Date(subscription.current_period_end * 1000)
      : null;

    if (companyName) user.companyName = companyName;
    if (vatId !== undefined) user.vatId = vatId;

    await user.save();

    res.json({
      subscriptionStatus: user.subscriptionStatus,
      currentPeriodEnd: user.currentPeriodEnd,
      subscriptionPlan: user.subscriptionPlan,
      companyName: user.companyName,
      vatId: user.vatId,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;