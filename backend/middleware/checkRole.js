module.exports = (allowedRoles) => {
    return (req, res, next) => {
      // Если юзера нет или его роль не подходит под разрешенные
      if (!req.user || !allowedRoles.includes(req.user.role)) {
        return res.status(403).json({ message: 'Отказано в доступе. Недостаточно прав.' });
      }
      next(); // Пропускаем
    };
  };