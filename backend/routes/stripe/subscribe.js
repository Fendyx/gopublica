const express    = require('express');
const router     = express.Router();
const {
  attachPaymentMethod,
  updateCustomer,
  ensureValidCustomer,
  createCustomer,
  setDefaultPaymentMethod,
  listTaxIds,
  deleteTaxId,
  createTaxId,
  retrievePrice,
} = require('../../services/payments/stripe');
const TenantUser = require('../../models/TenantUser');
const authTenant = require('../../middleware/auth/tenant');

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

    // Verify the Stripe customer still exists; if deleted, auto-create a new one
    const { customer: stripeCustomer, isNew } = await ensureValidCustomer(user.stripeCustomerId, user);
    if (isNew) {
      user.stripeCustomerId = stripeCustomer.id;
      await user.save();
    }
    const customerId = stripeCustomer.id;

    // Привязываем PaymentMethod к Customer
    await attachPaymentMethod(paymentMethodId, customerId);

    // 2. ОБНОВЛЯЕМ ДАННЫЕ CUSTOMER (Добавляем адрес/страну для налогов)
    const customerUpdateData = {};
    if (companyName && companyName !== user.companyName) {
      customerUpdateData.name = companyName;
    }
    
    if (country) {
      customerUpdateData.address = { country: country };
    }

    if (Object.keys(customerUpdateData).length > 0) {
      await updateCustomer(customerId, customerUpdateData);
    }

    // Устанавливаем PaymentMethod как дефолтный
    await setDefaultPaymentMethod(customerId, paymentMethodId);

    // 3. БЕЗОПАСНО ОБНОВЛЯЕМ VAT ID
    if (vatId !== undefined && vatId !== user.vatId) {
      const existingTaxIds = await listTaxIds(customerId);
      for (const tax of existingTaxIds.data) {
        if (tax.type === 'eu_vat') {
          await deleteTaxId(customerId, tax.id);
        }
      }
      
      if (vatId) {
        try {
          await createTaxId(customerId, {
            type: 'eu_vat',
            value: vatId.toUpperCase().replace(/\s/g, ''),
          });
        } catch (taxError) {
          return res.status(400).json({ error: 'Указан недействительный VAT номер' });
        }
      }
    }

    // 4. ПРОВЕРЯЕМ, ДОСТУПНА ЛИ ВАЛЮТА ДЛЯ ЭТОГО PRICE ID
    const price = await retrievePrice(priceId);
    const availableCurrencies = [
      price.currency,
      ...Object.keys(price.currency_options || {})
    ];

    if (!availableCurrencies.includes(normalizedCurrency)) {
      return res.status(400).json({ error: `Валюта ${normalizedCurrency.toUpperCase()} недоступна для этого тарифа` });
    }

    // 5. ОПРЕДЕЛЯЕМ STRIPE CUSTOMER ДЛЯ ПОДПИСКИ
    //    Stripe Customer currency is immutable once set by an invoice/payment.
    //    If the existing customer is locked to a different currency, we must
    //    create a fresh customer so that the subscription can use the desired currency.
    let subscriptionCustomerId = customerId;

    // stripeCustomer was already retrieved by ensureValidCustomer above
    if (stripeCustomer.currency && stripeCustomer.currency !== normalizedCurrency) {
      console.log(
        `⚠️ Customer ${user.stripeCustomerId} locked to ${stripeCustomer.currency.toUpperCase()}, ` +
        `creating new customer for ${normalizedCurrency.toUpperCase()}`
      );

      const newCustomer = await createCustomer({
        email: user.email,
        name: companyName || user.companyName || user.name,
        metadata: { userId: user._id.toString(), tenantId: user.tenantId || '' },
      });
      subscriptionCustomerId = newCustomer.id;

      // Migrate payment method to the new customer
      await attachPaymentMethod(paymentMethodId, newCustomer.id);
      await setDefaultPaymentMethod(newCustomer.id, paymentMethodId);

      // Update the local user record to point to the new Stripe customer
      user.stripeCustomerId = newCustomer.id;
    }

    // 6. СОЗДАЁМ ПОДПИСКУ С ПЕРЕДАЧЕЙ ВАЛЮТЫ
    const { Stripe } = require('../../services/payments/stripe');
    const subscription = await Stripe.subscriptions.create({
      customer: subscriptionCustomerId,
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