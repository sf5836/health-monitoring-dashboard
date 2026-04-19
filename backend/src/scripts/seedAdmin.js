<<<<<<< HEAD
const mongoose = require('mongoose');
const env = require('../config/env');
const User = require('../models/User');
const { hashPassword } = require('../services/authService');

async function seedAdmin() {
  const email = String(process.env.ADMIN_EMAIL || '').trim().toLowerCase();
  const password = String(process.env.ADMIN_PASSWORD || '');
  const fullName = String(process.env.ADMIN_FULL_NAME || 'Super Admin').trim();
  const phone = String(process.env.ADMIN_PHONE || '').trim();

  if (!env.mongoUri) {
    throw new Error('MONGO_URI is required to seed admin user.');
  }

  if (!email) {
    throw new Error('ADMIN_EMAIL is required.');
  }

  if (!password || password.length < 8) {
    throw new Error('ADMIN_PASSWORD is required and must be at least 8 characters.');
  }

  await mongoose.connect(env.mongoUri);

  const passwordHash = await hashPassword(password);

  const existingAdmin = await User.findOne({ email });

  if (existingAdmin) {
    existingAdmin.role = 'admin';
    existingAdmin.fullName = fullName;
    existingAdmin.phone = phone || existingAdmin.phone;
    existingAdmin.passwordHash = passwordHash;
    existingAdmin.isActive = true;
    await existingAdmin.save();

    console.log('[seed-admin] Updated existing admin user:', email);
  } else {
    await User.create({
      role: 'admin',
      fullName,
      email,
      phone: phone || undefined,
      passwordHash,
      isActive: true
    });

    console.log('[seed-admin] Created new admin user:', email);
  }

  await mongoose.connection.close();
  console.log('[seed-admin] Done.');
}

seedAdmin().catch(async (error) => {
  console.error('[seed-admin] Failed:', error.message);
  if (mongoose.connection.readyState !== 0) {
    await mongoose.connection.close();
  }
  process.exitCode = 1;
});
=======
const mongoose = require('mongoose');
const env = require('../config/env');
const User = require('../models/User');
const { hashPassword } = require('../services/authService');

async function seedAdmin() {
  const email = String(process.env.ADMIN_EMAIL || '').trim().toLowerCase();
  const password = String(process.env.ADMIN_PASSWORD || '');
  const fullName = String(process.env.ADMIN_FULL_NAME || 'Super Admin').trim();
  const phone = String(process.env.ADMIN_PHONE || '').trim();

  if (!env.mongoUri) {
    throw new Error('MONGO_URI is required to seed admin user.');
  }

  if (!email) {
    throw new Error('ADMIN_EMAIL is required.');
  }

  if (!password || password.length < 8) {
    throw new Error('ADMIN_PASSWORD is required and must be at least 8 characters.');
  }

  await mongoose.connect(env.mongoUri);

  const passwordHash = await hashPassword(password);

  const existingAdmin = await User.findOne({ email });

  if (existingAdmin) {
    existingAdmin.role = 'admin';
    existingAdmin.fullName = fullName;
    existingAdmin.phone = phone || existingAdmin.phone;
    existingAdmin.passwordHash = passwordHash;
    existingAdmin.isActive = true;
    await existingAdmin.save();

    console.log('[seed-admin] Updated existing admin user:', email);
  } else {
    await User.create({
      role: 'admin',
      fullName,
      email,
      phone: phone || undefined,
      passwordHash,
      isActive: true
    });

    console.log('[seed-admin] Created new admin user:', email);
  }

  await mongoose.connection.close();
  console.log('[seed-admin] Done.');
}

seedAdmin().catch(async (error) => {
  console.error('[seed-admin] Failed:', error.message);
  if (mongoose.connection.readyState !== 0) {
    await mongoose.connection.close();
  }
  process.exitCode = 1;
});
>>>>>>> 3679fdb51da36730665e1e953a244aa81087f3e4
