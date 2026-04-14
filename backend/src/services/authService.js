const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { createHash } = require('crypto');

const env = require('../config/env');

function signAccessToken(user) {
  return jwt.sign(
    { sub: String(user._id), role: user.role, email: user.email },
    env.jwtAccessSecret,
    { expiresIn: env.jwtAccessExpiresIn }
  );
}

function signRefreshToken(user) {
  return jwt.sign({ sub: String(user._id), role: user.role }, env.jwtRefreshSecret, {
    expiresIn: env.jwtRefreshExpiresIn
  });
}

function verifyAccessToken(token) {
  return jwt.verify(token, env.jwtAccessSecret);
}

function verifyRefreshToken(token) {
  return jwt.verify(token, env.jwtRefreshSecret);
}

async function hashPassword(plainPassword) {
  return bcrypt.hash(plainPassword, 10);
}

async function verifyPassword(user, plainPassword) {
  if (!user || !user.passwordHash) {
    return false;
  }

  const isBcryptHash = user.passwordHash.startsWith('$2');

  if (isBcryptHash) {
    return bcrypt.compare(plainPassword, user.passwordHash);
  }

  const legacyHash = createHash('sha256').update(plainPassword).digest('hex');
  const isLegacyMatch = legacyHash === user.passwordHash;

  if (isLegacyMatch) {
    user.passwordHash = await hashPassword(plainPassword);
    await user.save();
  }

  return isLegacyMatch;
}

module.exports = {
  signAccessToken,
  signRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  hashPassword,
  verifyPassword
};
