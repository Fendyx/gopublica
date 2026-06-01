const express = require('express');
const router = express.Router();
const NewsPost = require('../../models/NewsPost');
const Client = require('../../models/client'); // твоя модель клиента — убедись, что путь правильный
const authTenant = require('../../middleware/authTenant');

// Публичный (для клиента): получить новости с учётом таргетинга
router.get('/', async (req, res) => {
  try {
    const { tenantId, tariff } = req.query;
    if (!tenantId) {
      return res.status(400).json({ error: 'tenantId обязателен' });
    }

    // 1. Находим клиента, чтобы узнать дату его регистрации (если нужно)
    const client = await Client.findOne({ tenantId });
    const clientCreatedAt = client?.createdAt || new Date(); // fallback — сейчас

    // 2. Базовый фильтр: не истекшие и подходящие по таргетингу
    const filter = {
      $or: [
        { targetTenants: { $size: 0 } }, // всем
        { targetTenants: tenantId },      // конкретному
      ],
      $and: [
        {
          $or: [
            { targetTariffs: { $size: 0 } },
            { targetTariffs: tariff || '' },
          ],
        },
        {
          $or: [
            { expiresAt: null },
            { expiresAt: { $gt: new Date() } },
          ],
        },
      ],
    };

    let posts = await NewsPost.find(filter).sort({ createdAt: -1 }).lean();

    // 3. Отфильтровываем по showToNewClients, если нужно
    // Если showToNewClients === false, то клиент должен был быть зарегистрирован
    // до даты публикации новости
    posts = posts.filter((post) => {
      if (post.showToNewClients) {
        return true; // показываем всем
      }
      // Не показывать новым клиентам — проверяем дату
      return clientCreatedAt <= new Date(post.createdAt);
    });

    res.json(posts);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Создать новость (только для CRM — твоя auth middleware)
router.post('/', authTenant, async (req, res) => {
  try {
    const {
      type,
      title,
      content,
      targetTenants,
      targetTariffs,
      showToNewClients,
      expiresAt,
    } = req.body;

    const post = new NewsPost({
      type,
      title,
      content,
      targetTenants: targetTenants || [],
      targetTariffs: targetTariffs || [],
      showToNewClients: showToNewClients || false,
      expiresAt: expiresAt || null,
    });

    await post.save();
    res.status(201).json(post);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Удалить новость (для CRM)
router.delete('/:id', authTenant, async (req, res) => {
  try {
    await NewsPost.findByIdAndDelete(req.params.id);
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;