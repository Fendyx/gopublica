const express    = require('express');
const router     = express.Router();
const Stripe     = require('stripe')(process.env.STRIPE_SECRET_KEY);
const TenantUser = require('../../models/TenantUser');
const authTenant = require('../../middleware/authTenant');

router.post('/subscribe', authTenant, async (req, res) => {
  try {
    // 1. ПРИНИМАЕМ CURRENCY И COUNTRY ИЗ ТЕЛА ЗАПРОСА
    const { paymentMethodId, priceId, companyName, vatId, country, currency } = req.body;

    if (!currency) {
      return res.status(400).json({ error: 'Валюта не указана' });
    }
    const normalizedCurrency = currency.toLowerCase();

    const user = await TenantUser.findById(req.userId);
    if (!user) return res.status(404).json({ error: 'Пользователь не найден' });
    if (!user.stripeCustomerId) {
      return res.status(400).json({ error: 'Stripe customer не найден' });
    }

    // ЗАЩИТА: нельзя сменить валюту, если подписка уже активна в другой валюте
    if (user.subscriptionCurrency && user.subscriptionCurrency !== normalizedCurrency) {
      return res.status(400).json({ 
        error: `У вас уже активна подписка в ${user.subscriptionCurrency.toUpperCase()}. Смена валюты недоступна.` 
      });
    }

    // Привязываем PaymentMethod к Customer
    await Stripe.paymentMethods.attach(paymentMethodId, {
      customer: user.stripeCustomerId,
    });

    // 2. ОБНОВЛЯЕМ ДАННЫЕ CUSTOMER (Добавляем адрес/страну для налогов)
    const customerUpdateData = {};
    if (companyName && companyName !== user.companyName) {
      customerUpdateData.name = companyName;
    }
    
    if (country) {
      customerUpdateData.address = { country: country };
    }

    if (Object.keys(customerUpdateData).length > 0) {
      await Stripe.customers.update(user.stripeCustomerId, customerUpdateData);
    }

    // Устанавливаем PaymentMethod как дефолтный
    await Stripe.customers.update(user.stripeCustomerId, {
      invoice_settings: { default_payment_method: paymentMethodId },
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
          await Stripe.customers.createTaxId(user.stripeCustomerId, {
            type: 'eu_vat',
            value: vatId.toUpperCase().replace(/\s/g, ''),
          });
        } catch (taxError) {
          return res.status(400).json({ error: 'Указан недействительный VAT номер' });
        }
      }
    }

    // 4. ПРОВЕРЯЕМ, ДОСТУПНА ЛИ ВАЛЮТА ДЛЯ ЭТОГО PRICE ID
    const price = await Stripe.prices.retrieve(priceId);
    const availableCurrencies = [
      price.currency,
      ...Object.keys(price.currency_options || {})
    ];

    if (!availableCurrencies.includes(normalizedCurrency)) {
      return res.status(400).json({ error: `Валюта ${normalizedCurrency.toUpperCase()} недоступна для этого тарифа` });
    }

    // 5. СОЗДАЁМ ПОДПИСКУ С ПЕРЕДАЧЕЙ ВАЛЮТЫ
    const subscription = await Stripe.subscriptions.create({
      customer: user.stripeCustomerId,
      items: [{ price: priceId }],
      currency: normalizedCurrency, // <-- КЛЮЧЕВАЯ СТРОКА МУЛЬТИВАЛЮТНОСТИ
      trial_period_days: 30,
      default_payment_method: paymentMethodId,
      automatic_tax: { enabled: true },
      metadata: {
        userId: user._id.toString(),
        tenantId: user.tenantId || '',
      },
    });

    // Обновляем локального пользователя
    user.stripeSubscriptionId = subscription.id;
    user.subscriptionStatus = subscription.status;
    user.subscriptionPlan = 'basic';
    user.subscriptionCurrency = normalizedCurrency; // СОХРАНЯЕМ ВАЛЮТУ
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
      subscriptionCurrency: user.subscriptionCurrency,
      companyName: user.companyName,
      vatId: user.vatId,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;