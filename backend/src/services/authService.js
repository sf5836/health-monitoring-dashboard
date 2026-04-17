const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { createHash, randomBytes } = require('crypto');

const env = require('../config/env');
const RefreshToken = require('../models/RefreshToken');

function signAccessToken(user) {
  return jwt.sign(
    { sub: String(user._id), role: user.role, email: user.email },
    env.jwtAccessSecret,
    { expiresIn: env.jwtAccessExpiresIn }
  );
}

function signRefreshToken(user, tokenId) {
  return jwt.sign({ sub: String(user._id), role: user.role, jti: tokenId }, env.jwtRefreshSecret, {
    expiresIn: env.jwtRefreshExpiresIn
  });
}

function verifyAccessToken(token) {
  return jwt.verify(token, env.jwtAccessSecret);
}

function verifyRefreshToken(token) {
  return jwt.verify(token, env.jwtRefreshSecret);
}

function hashRefreshToken(token) {
  return createHash('sha256').update(token).digest('hex');
}

function generateTokenId() {
  return randomBytes(16).toString('hex');
}

function getTokenExpiryDate(token) {
  const decoded = jwt.decode(token);
  const exp = decoded && typeof decoded === 'object' ? decoded.exp : null;

  if (!exp) {
    const error = new Error('Unable to determine refresh token expiry');
    error.statusCode = 500;
    throw error;
  }

  return new Date(exp * 1000);
}

async function issueRefreshToken(user) {
  const tokenId = generateTokenId();
  const token = signRefreshToken(user, tokenId);
  const expiresAt = getTokenExpiryDate(token);

  await RefreshToken.create({
    userId: user._id,
    tokenId,
    tokenHash: hashRefreshToken(token),
    expiresAt
  });

  return {
    token,
    tokenId,
    expiresAt
  };
}

async function revokeRefreshToken(token, options = {}) {
  if (!token) {
    return false;
  }

  const filter = {
    tokenHash: hashRefreshToken(token),
    revokedAt: null
  };

  if (options.userId) {
    filter.userId = String(options.userId);
  }

  const revoked = await RefreshToken.findOneAndUpdate(
    filter,
    { $set: { revokedAt: new Date() } },
    { new: true }
  );

  return Boolean(revoked);
}

async function consumeRefreshToken(token, payload) {
  const resolvedPayload = payload || verifyRefreshToken(token);
  const now = new Date();

  const current = await RefreshToken.findOneAndUpdate(
    {
      tokenHash: hashRefreshToken(token),
      tokenId: resolvedPayload.jti,
      userId: resolvedPayload.sub,
      revokedAt: null,
      expiresAt: { $gt: now }
    },
    { $set: { revokedAt: now } },
    { new: true }
  );

  if (!current) {
    const error = new Error('Invalid or expired refresh token');
    error.statusCode = 401;
    throw error;
  }

  return {
    payload: resolvedPayload,
    record: current
  };
}

async function rotateRefreshToken(token, user, payload) {
  const consumed = await consumeRefreshToken(token, payload);

  if (String(consumed.payload.sub) !== String(user._id)) {
    const error = new Error('Invalid refresh token subject');
    error.statusCode = 401;
    throw error;
  }

  const issued = await issueRefreshToken(user);

  await RefreshToken.updateOne(
    { _id: consumed.record._id },
    { $set: { replacedByTokenId: issued.tokenId } }
  );

  return issued;
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
  issueRefreshToken,
  revokeRefreshToken,
  consumeRefreshToken,
  rotateRefreshToken,
  hashPassword,
  verifyPassword
};
