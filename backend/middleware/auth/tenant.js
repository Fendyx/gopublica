const jwt = require('jsonwebtoken');

module.exports = function authTenant(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Токен не предоставлен' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.tenantId = decoded.tenantId;
    req.userRole = decoded.role;
    req.userId = decoded.userId;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Недействительный токен' });
  }
};