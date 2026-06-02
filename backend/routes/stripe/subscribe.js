// backend/routes/stripe/subscribe.js

const express    = require('express');
const router     = express.Router();
const Stripe     = require('stripe')(process.env.STRIPE_SECRET_KEY);
const TenantUser = require('../../models/TenantUser');
const authTenant = require('../../middleware/authTenant');

router.post('/subscribe', authTenant, async (req, res) => {
  try {
    // 1. ПРИНИМАЕМ COUNTRY ИЗ ТЕЛА ЗАПРОСА
    const { paymentMethodId, priceId, companyName, vatId, country } = req.body;

    const user = await TenantUser.findById(req.userId);
    if (!user) return res.status(404).json({ error: 'Пользователь не найден' });
    if (!user.stripeCustomerId) {
      return res.status(400).json({ error: 'Stripe customer не найден' });
    }

    // Привязываем PaymentMethod к Customer
    await Stripe.paymentMethods.attach(paymentMethodId, {
      customer: user.stripeCustomerId,
    });

    // 2. ОБНОВЛЯЕМ ДАННЫЕ CUSTOMER (Добавляем адрес/страну)
    const customerUpdateData = {};
    if (companyName && companyName !== user.companyName) {
      customerUpdateData.name = companyName;
    }
    
    // Stripe Tax ОЧЕНЬ требует страну для расчета налогов!
    if (country) {
      customerUpdateData.address = {
        country: country,
      };
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

    // 3. БЕЗОПАСНО ОБНОВЛЯЕМ VAT ID
    if (vatId !== undefined && vatId !== user.vatId) {
      const existingTaxIds = await Stripe.customers.listTaxIds(user.stripeCustomerId);
      for (const tax of existingTaxIds.data) {
        if (tax.type === 'eu_vat') {
          await Stripe.customers.deleteTaxId(user.stripeCustomerId, tax.id);
        }
      }
      
      if (vatId) {
        try {
          // Если номер невалидный (нет в базе VIES), Stripe выбросит ошибку
          await Stripe.customers.createTaxId(user.stripeCustomerId, {
            type: 'eu_vat',
            value: vatId.toUpperCase().replace(/\s/g, ''), // Чистим пробелы
          });
        } catch (taxError) {
          return res.status(400).json({ error: 'Указан недействительный VAT номер' });
        }
      }
    }

    // 4. СОЗДАЁМ ПОДПИСКУ С ВКЛЮЧЕННЫМ АВТО-НАЛОГОМ
    const subscription = await Stripe.subscriptions.create({
      customer: user.stripeCustomerId,
      items: [{ price: priceId }],
      // trial_period_days: 30,
      default_payment_method: paymentMethodId,
      
      // ВОТ ОНА - МАГИЯ СТРАЙПА ДЛЯ VAT OSS И REVERSE CHARGE!
      automatic_tax: {
        enabled: true, 
      },
      
      metadata: {
        userId: user._id.toString(),
        tenantId: user.tenantId || '',
      },
    });

    // Обновляем локального пользователя
    user.stripeSubscriptionId = subscription.id;
    user.subscriptionStatus = subscription.status;
    user.subscriptionPlan = 'basic';
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