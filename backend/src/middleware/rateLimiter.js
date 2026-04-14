const rateLimit = require('express-rate-limit');

function createRateLimiter(options) {
  return rateLimit({
    windowMs: options.windowMs,
    max: options.max,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
      success: false,
      message: options.message || 'Too many requests, please try again later.',
      errors: []
    }
  });
}

const authLoginLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: 'Too many login attempts. Please try again in 15 minutes.'
});

const authGeneralLimiter = createRateLimiter({
  windowMs: 10 * 60 * 1000,
  max: 60,
  message: 'Too many auth requests. Please slow down.'
});

const adminActionLimiter = createRateLimiter({
  windowMs: 10 * 60 * 1000,
  max: 120,
  message: 'Too many admin requests. Please try again shortly.'
});

module.exports = {
  createRateLimiter,
  authLoginLimiter,
  authGeneralLimiter,
  adminActionLimiter
};