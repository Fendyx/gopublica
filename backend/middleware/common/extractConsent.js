/**
 * Extracts client IP and User-Agent from the request and attaches them
 * to `req.consentContext` for downstream consent-recording logic.
 *
 * IP resolution order (after trust proxy is set):
 *   1. req.ip (Express resolves via trust proxy + X-Forwarded-For)
 *   2. X-Forwarded-For header (first entry)
 *   3. req.socket.remoteAddress
 *   4. 'unknown'
 */
module.exports = function extractConsent(req, _res, next) {
  const ip =
    req.ip ||
    req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
    req.socket?.remoteAddress ||
    'unknown';

  const userAgent = req.get('User-Agent') || '';

  req.consentContext = {
    ip,
    userAgent,
    timestamp: new Date(),
  };

  next();
};
