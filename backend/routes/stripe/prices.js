const express = require('express');
const router = express.Router();
const { retrievePrice } = require('../../services/payments/stripe');

// GET /api/stripe/prices/:priceId
router.get('/:priceId', async (req, res) => {
  try {
    const price = await retrievePrice(req.params.priceId);
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