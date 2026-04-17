const User = require('../models/User');
const { verifyAccessToken } = require('../services/authService');

function extractToken(socket) {
  const authToken = socket.handshake.auth?.token;
  if (authToken && typeof authToken === 'string') {
    return authToken;
  }

  const header = socket.handshake.headers?.authorization;
  if (header && typeof header === 'string' && header.startsWith('Bearer ')) {
    return header.slice(7);
  }

  return null;
}

module.exports = async function authenticateSocket(socket, next) {
  try {
    const token = extractToken(socket);
    if (!token) {
      const error = new Error('Unauthorized socket connection');
      error.data = { code: 'UNAUTHORIZED', message: 'Access token is required' };
      return next(error);
    }

    const payload = verifyAccessToken(token);
    const user = await User.findById(payload.sub).select('_id role email isActive').lean();

    if (!user || !user.isActive) {
      const error = new Error('Unauthorized socket connection');
      error.data = { code: 'UNAUTHORIZED', message: 'User not found or inactive' };
      return next(error);
    }

    socket.data.user = {
      id: String(user._id),
      role: user.role,
      email: user.email
    };

    return next();
  } catch (error) {
    const authError = new Error('Unauthorized socket connection');
    authError.data = {
      code: 'UNAUTHORIZED',
      message: 'Invalid or expired access token'
    };
    return next(authError);
  }
};
