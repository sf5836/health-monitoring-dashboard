const mongoose = require('mongoose');
const env = require('./env');

async function connectDB() {
  if (!env.mongoUri) {
    console.warn('[db] MONGO_URI is not set. Running without database connection.');
    return;
  }

  await mongoose.connect(env.mongoUri);
  console.log('[db] Connected to MongoDB');
}

module.exports = connectDB;