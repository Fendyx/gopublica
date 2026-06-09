// Защищённый роут: добавление блюда
router.post('/', authTenant, async (req, res) => {
  try {
    const {
      name,
      description,
      price,
      category,
      categoryKey,
      image,
      isVegetarian,
      isSpicy,
      order,
      translations,
      branchId,  // добавить
    } = req.body;

    const newItem = new MenuItem({
      tenantId: req.tenantId,
      branchId: branchId || null,   // если не передан – глобальное
      baseItemId: null,             // пока не используем
      name,
      description,
      price,
      category,
      categoryKey,
      image,
      isVegetarian,
      isSpicy,
      order,
      translations,
    });
    await newItem.save();
    res.status(201).json(newItem);
  } catch (err) {
    console.error('Ошибка в POST /api/saas/menu:', err);
    res.status(500).json({ error: err.message });
  }
});

// Обновление (защищённый)
router.put('/:id', authTenant, async (req, res) => {
  try {
    const item = await MenuItem.findById(req.params.id);
    if (!item) {
      return res.status(404).json({ error: 'Блюдо не найдено' });
    }
    if (item.tenantId !== req.tenantId) {
      return res.status(403).json({ error: 'Доступ запрещён' });
    }

    // Обновляем, но branchId обычно не меняем (или разрешим, но осторожно)
    const { branchId, ...updateData } = req.body;
    if (branchId !== undefined) item.branchId = branchId;
    Object.assign(item, updateData);
    await item.save();
    res.json(item);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});