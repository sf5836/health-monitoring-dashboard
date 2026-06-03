const mongoose = require('mongoose');
const env = require('../config/env');
const User = require('../models/User');
const DoctorProfile = require('../models/DoctorProfile');
const Appointment = require('../models/Appointment');
const { hashPassword } = require('../services/authService');

const DEFAULT_PASSWORD = String(process.env.SEED_PASSWORD || 'ChangeMe123!');

const doctors = [
  {
    fullName: 'Dr. Aisha Rahman',
    email: 'aisha.rahman+seed@healthmonitorpro.dev',
    specialization: 'Cardiology'
  },
  {
    fullName: 'Dr. Miguel Santos',
    email: 'miguel.santos+seed@healthmonitorpro.dev',
    specialization: 'Endocrinology'
  }
];

const patients = [
  { fullName: 'Sofia Patel', email: 'sofia.patel+seed@healthmonitorpro.dev' },
  { fullName: 'Daniel Wong', email: 'daniel.wong+seed@healthmonitorpro.dev' },
  { fullName: 'Liam Carter', email: 'liam.carter+seed@healthmonitorpro.dev' },
  { fullName: 'Amira Khan', email: 'amira.khan+seed@healthmonitorpro.dev' }
];

const reviewNotes = [
  'Thoughtful and clear explanations. Follow-up plan felt practical.',
  'Listened carefully and adjusted medication quickly.',
  'Appointment was on time and covered all my concerns.',
  'Very reassuring and easy to talk to.',
  'Helped me understand my lab results without jargon.',
  'Quick diagnosis and a solid action plan.',
  'Gave lifestyle guidance that was realistic for me.',
  'Kind and patient throughout the visit.',
  'Answered all my questions and explained next steps.',
  'Felt supported and confident after the appointment.'
];

const appointmentSlots = [
  { date: '2026-04-10', time: '09:00', type: 'in_person' },
  { date: '2026-04-11', time: '10:30', type: 'teleconsult' },
  { date: '2026-04-12', time: '11:15', type: 'in_person' },
  { date: '2026-04-13', time: '14:00', type: 'teleconsult' },
  { date: '2026-04-14', time: '15:30', type: 'in_person' },
  { date: '2026-04-15', time: '16:00', type: 'teleconsult' },
  { date: '2026-04-16', time: '09:45', type: 'in_person' },
  { date: '2026-04-17', time: '13:15', type: 'teleconsult' },
  { date: '2026-04-18', time: '10:00', type: 'in_person' },
  { date: '2026-04-19', time: '11:45', type: 'teleconsult' }
];

async function ensureUser({ role, fullName, email }) {
  const normalizedEmail = String(email).trim().toLowerCase();
  const passwordHash = await hashPassword(DEFAULT_PASSWORD);

  const existing = await User.findOne({ email: normalizedEmail });
  if (existing) {
    existing.role = role;
    existing.fullName = fullName;
    existing.passwordHash = passwordHash;
    existing.isActive = true;
    await existing.save();
    return existing;
  }

  return User.create({
    role,
    fullName,
    email: normalizedEmail,
    passwordHash,
    isActive: true
  });
}

async function ensureDoctorProfile(user, specialization) {
  const existing = await DoctorProfile.findOne({ userId: user._id });
  if (existing) {
    existing.specialization = specialization || existing.specialization;
    existing.approvalStatus = 'approved';
    await existing.save();
    return existing;
  }

  return DoctorProfile.create({
    userId: user._id,
    specialization,
    approvalStatus: 'approved',
    rating: 4.8,
    reviewsCount: 0
  });
}

async function seedReviews() {
  if (!env.mongoUri) {
    throw new Error('MONGO_URI is required to seed reviews.');
  }

  if (DEFAULT_PASSWORD.length < 8) {
    throw new Error('SEED_PASSWORD must be at least 8 characters.');
  }

  await mongoose.connect(env.mongoUri);

  const doctorUsers = [];
  for (const doctor of doctors) {
    const user = await ensureUser({
      role: 'doctor',
      fullName: doctor.fullName,
      email: doctor.email
    });
    await ensureDoctorProfile(user, doctor.specialization);
    doctorUsers.push(user);
  }

  const patientUsers = [];
  for (const patient of patients) {
    const user = await ensureUser({
      role: 'patient',
      fullName: patient.fullName,
      email: patient.email
    });
    patientUsers.push(user);
  }

  let createdCount = 0;
  for (let index = 0; index < reviewNotes.length; index += 1) {
    const doctor = doctorUsers[index % doctorUsers.length];
    const patient = patientUsers[index % patientUsers.length];
    const slot = appointmentSlots[index % appointmentSlots.length];

    const existingAppointment = await Appointment.findOne({
      doctorId: doctor._id,
      patientId: patient._id,
      date: slot.date,
      time: slot.time,
      status: 'completed'
    });

    if (existingAppointment) {
      if (!existingAppointment.notes) {
        existingAppointment.notes = reviewNotes[index];
        await existingAppointment.save();
      }
      continue;
    }

    await Appointment.create({
      doctorId: doctor._id,
      patientId: patient._id,
      type: slot.type,
      date: slot.date,
      time: slot.time,
      status: 'completed',
      notes: reviewNotes[index],
      createdBy: 'patient'
    });

    createdCount += 1;
  }

  for (const doctor of doctorUsers) {
    const reviewCount = await Appointment.countDocuments({
      doctorId: doctor._id,
      status: 'completed',
      notes: { $exists: true, $ne: '' }
    });

    await DoctorProfile.findOneAndUpdate(
      { userId: doctor._id },
      {
        reviewsCount: reviewCount,
        rating: reviewCount > 0 ? 4.7 + Math.min(reviewCount, 3) * 0.1 : 5
      },
      { new: true }
    );
  }

  console.log(`[seed-reviews] Created ${createdCount} review appointments.`);
  console.log('[seed-reviews] Done.');

  await mongoose.connection.close();
}

seedReviews().catch(async (error) => {
  console.error('[seed-reviews] Failed:', error.message);
  if (mongoose.connection.readyState !== 0) {
    await mongoose.connection.close();
  }
  process.exitCode = 1;
});
