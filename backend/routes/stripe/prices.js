const express = require('express');
const router = express.Router();
const Stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

// GET /api/stripe/prices/:priceId
router.get('/:priceId', async (req, res) => {
  try {
    const price = await Stripe.prices.retrieve(req.params.priceId);
    const result = {
      id: price.id,
      default: {
        currency: price.currency,
        amount: price.unit_amount, // в центах/копейках
      },
      options: {},
    };

    // Собираем все currency_options
    if (price.currency_options) {
      for (const [currency, opt] of Object.entries(price.currency_options)) {
        result.options[currency] = opt.unit_amount;
      }
    }

    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;