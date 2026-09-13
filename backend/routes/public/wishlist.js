const express = require('express');
const router = express.Router();
const Wishlist = require('../../models/Wishlist');
const CustomerUser = require('../../models/CustomerUser');
const MenuItem = require('../../models/food/MenuItem');
const jwt = require('jsonwebtoken');

// ── Auth middleware (same pattern as profile.js) ─────────────────────────────
const authCustomer = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (decoded.role !== 'customer') {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const user = await CustomerUser.findById(decoded.userId);
    if (!user) return res.status(401).json({ error: 'User not found' });

    req.customerUserId = decoded.userId;
    req.tenantId = decoded.tenantId;
    next();
  } catch (err) {
    res.status(401).json({ error: 'Invalid token' });
  }
};

// ── GET /api/public/wishlist ── Return all wishlisted product IDs for the customer ──
router.get('/', authCustomer, async (req, res) => {
  try {
    const items = await Wishlist.find({
      tenantId: req.tenantId,
      customerUserId: req.customerUserId,
    }).select('productId createdAt').sort({ createdAt: -1 });

    res.json({ items });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── GET /api/public/wishlist/products ── Return full product details for wishlisted items ──
router.get('/products', authCustomer, async (req, res) => {
  try {
    const items = await Wishlist.find({
      tenantId: req.tenantId,
      customerUserId: req.customerUserId,
    }).select('productId createdAt').sort({ createdAt: -1 });

    if (items.length === 0) {
      return res.json({ products: [] });
    }

    const productIds = items.map((i) => i.productId);
    const products = await MenuItem.find({
      _id: { $in: productIds },
      tenantId: req.tenantId,
    })
      .select('name price image images stock category compareAtPrice variants')
      .lean();

    // Preserve wishlist order (most recently wishlisted first) and attach wishlistedAt
    const byId = new Map(products.map((p) => [String(p._id), p]));
    const ordered = items
      .map((i) => {
        const product = byId.get(i.productId);
        if (!product) return null;
        return { ...product, wishlistedAt: i.createdAt };
      })
      .filter(Boolean);

    res.json({ products: ordered });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── POST /api/public/wishlist/:productId ── Add product to wishlist ──
router.post('/:productId', authCustomer, async (req, res) => {
  try {
    const { productId } = req.params;

    const item = await Wishlist.findOneAndUpdate(
      {
        tenantId: req.tenantId,
        customerUserId: req.customerUserId,
        productId,
      },
      {},
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    res.json({ ok: true, item });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── DELETE /api/public/wishlist/:productId ── Remove product from wishlist ──
router.delete('/:productId', authCustomer, async (req, res) => {
  try {
    const { productId } = req.params;

    await Wishlist.findOneAndDelete({
      tenantId: req.tenantId,
      customerUserId: req.customerUserId,
      productId,
    });

    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
