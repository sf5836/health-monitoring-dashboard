const { verifyAccessToken } = require('../services/authService');

module.exports = function verifyToken(req, _res, next) {
  try {
    const authorization = req.headers.authorization || '';
    const token = authorization.startsWith('Bearer ')
      ? authorization.slice(7)
      : null;

    if (!token) {
      const error = new Error('Authorization token is required');
      error.statusCode = 401;
      throw error;
    }

    const payload = verifyAccessToken(token);
    req.user = {
      id: payload.sub,
      role: payload.role,
      email: payload.email
    };

    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      error.statusCode = 401;
      error.message = 'Invalid or expired access token';
    }
    next(error);
  }
};