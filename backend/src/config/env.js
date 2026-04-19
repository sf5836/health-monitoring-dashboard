const dotenv = require('dotenv');

dotenv.config();

function parseOrigins(value) {
  return String(value || '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

const clientOrigins = parseOrigins(
  process.env.CLIENT_ORIGINS || process.env.CLIENT_ORIGIN || 'http://localhost:5173'
);

const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT || 5000),
  clientOrigin: clientOrigins[0] || 'http://localhost:5173',
  clientOrigins,
  mongoUri: process.env.MONGO_URI || '',
  jwtAccessSecret:
    process.env.JWT_ACCESS_PRIVATE_KEY || 'healthmonitorpro-dev-access-secret',
  jwtRefreshSecret:
    process.env.JWT_REFRESH_PRIVATE_KEY || 'healthmonitorpro-dev-refresh-secret',
  jwtAccessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '15m',
  jwtRefreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d'
};

module.exports = env;