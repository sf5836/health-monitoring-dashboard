const mongoose = require('mongoose');
const connectDB = require('../config/db');

const User = require('../models/User');
const PatientProfile = require('../models/PatientProfile');
const DoctorProfile = require('../models/DoctorProfile');
const VitalRecord = require('../models/VitalRecord');
const Appointment = require('../models/Appointment');
const Prescription = require('../models/Prescription');
const Blog = require('../models/Blog');
const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const Notification = require('../models/Notification');
const AuditLog = require('../models/AuditLog');

const models = [
  User,
  PatientProfile,
  DoctorProfile,
  VitalRecord,
  Appointment,
  Prescription,
  Blog,
  Conversation,
  Message,
  Notification,
  AuditLog
];

async function initCollections() {
  try {
    await connectDB();

    for (const model of models) {
      await model.createCollection();
      await model.syncIndexes();
      console.log(`[db:init] ready: ${model.collection.collectionName}`);
    }

    console.log('[db:init] Collections and indexes initialized successfully.');
    process.exit(0);
  } catch (error) {
    console.error('[db:init] Failed to initialize collections:', error.message);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
  }
}

initCollections();
