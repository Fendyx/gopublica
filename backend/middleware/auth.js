//backend/middleware/auth.js
const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_key_gopublica';

module.exports = (req, res, next) => {
  // Ищем токен в заголовках запроса
  const token = req.header('Authorization')?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({ message: 'Нет доступа. Токен отсутствует.' });
  }

  try {
    // Расшифровываем токен
    const decoded = jwt.verify(token, JWT_SECRET);
    // Кладем данные юзера (id и role) в запрос, чтобы другие функции их видели
    req.user = decoded; 
    next(); // Пропускаем дальше
  } catch (error) {
    res.status(401).json({ message: 'Неверный или просроченный токен.' });
  }
};