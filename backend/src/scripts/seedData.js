const mongoose = require('mongoose');
const { createHash } = require('crypto');

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

function hashSeedPassword(password) {
  return createHash('sha256').update(password).digest('hex');
}

async function upsertUser({ role, fullName, email, phone, password }) {
  const passwordHash = hashSeedPassword(password);

  const user = await User.findOneAndUpdate(
    { email },
    {
      $setOnInsert: {
        role,
        fullName,
        email,
        phone,
        passwordHash,
        isActive: true
      }
    },
    { new: true, upsert: true }
  );

  return user;
}

async function seed() {
  try {
    await connectDB();

    const admin = await upsertUser({
      role: 'admin',
      fullName: 'Admin User',
      email: 'admin@healthmonitorpro.local',
      phone: '+10000000001',
      password: 'Admin@123'
    });

    const doctor = await upsertUser({
      role: 'doctor',
      fullName: 'Dr Sarah Khan',
      email: 'doctor@healthmonitorpro.local',
      phone: '+10000000002',
      password: 'Doctor@123'
    });

    const patient = await upsertUser({
      role: 'patient',
      fullName: 'Ali Raza',
      email: 'patient@healthmonitorpro.local',
      phone: '+10000000003',
      password: 'Patient@123'
    });

    await DoctorProfile.findOneAndUpdate(
      { userId: doctor._id },
      {
        $set: {
          specialization: 'Cardiology',
          licenseNumber: 'DOC-1001',
          qualifications: ['MBBS', 'FCPS Cardiology'],
          experienceYears: 8,
          hospital: 'City Care Hospital',
          fee: 2500,
          bio: 'Cardiologist focused on preventive care and lifestyle management.',
          availability: 'Mon-Fri 10:00-16:00',
          approvalStatus: 'approved',
          approvalNote: 'Verified and approved.',
          approvedBy: admin._id,
          approvedAt: new Date()
        }
      },
      { upsert: true, new: true }
    );

    await PatientProfile.findOneAndUpdate(
      { userId: patient._id },
      {
        $set: {
          dob: new Date('1994-03-14'),
          gender: 'male',
          bloodGroup: 'B+',
          heightCm: 174,
          weightKg: 78,
          allergies: ['Dust'],
          medications: ['Vitamin D'],
          medicalHistory: 'Family history of hypertension.',
          emergencyContact: {
            name: 'Ayesha Raza',
            relationship: 'Sister',
            phone: '+10000000004'
          },
          connectedDoctorIds: [doctor._id]
        }
      },
      { upsert: true, new: true }
    );

    const vitalsSeed = [
      {
        patientId: patient._id,
        datetime: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2),
        bloodPressure: { systolic: 128, diastolic: 82 },
        heartRate: 78,
        spo2: 98,
        temperatureC: 36.8,
        glucose: { value: 96, mode: 'fasting' },
        weightKg: 78,
        riskLevel: 'normal',
        riskReasons: []
      },
      {
        patientId: patient._id,
        datetime: new Date(Date.now() - 1000 * 60 * 60 * 24),
        bloodPressure: { systolic: 142, diastolic: 90 },
        heartRate: 96,
        spo2: 96,
        temperatureC: 37.0,
        glucose: { value: 132, mode: 'fasting' },
        weightKg: 78.3,
        riskLevel: 'medium',
        riskReasons: ['BP elevated', 'Fasting glucose elevated']
      }
    ];

    if ((await VitalRecord.countDocuments({ patientId: patient._id })) === 0) {
      await VitalRecord.insertMany(vitalsSeed);
    }

    const appointment = await Appointment.findOneAndUpdate(
      { patientId: patient._id, doctorId: doctor._id, date: '2026-04-15', time: '11:00' },
      {
        $setOnInsert: {
          type: 'in_person',
          status: 'confirmed',
          notes: 'Routine follow up for BP trend review',
          createdBy: 'patient'
        }
      },
      { upsert: true, new: true }
    );

    await Prescription.findOneAndUpdate(
      { patientId: patient._id, doctorId: doctor._id, diagnosis: 'Stage 1 Hypertension' },
      {
        $setOnInsert: {
          medications: [
            {
              name: 'Amlodipine',
              dosage: '5mg',
              frequency: 'Once daily',
              duration: '30 days'
            }
          ],
          instructions: 'Reduce salt intake and track BP daily.',
          followUpDate: new Date('2026-05-01'),
          issuedAt: new Date()
        }
      },
      { upsert: true, new: true }
    );

    await Blog.findOneAndUpdate(
      { title: 'How to Monitor Blood Pressure at Home' },
      {
        $setOnInsert: {
          authorId: doctor._id,
          authorRole: 'doctor',
          excerpt: 'A practical guide to better BP measurements at home.',
          content:
            'Use a validated cuff, sit calmly for 5 minutes, take 2-3 readings, and record trends over time.',
          coverImageUrl: 'https://images.example.com/bp-guide.jpg',
          category: 'Cardiology',
          tags: ['blood pressure', 'heart health', 'prevention'],
          status: 'published',
          submittedAt: new Date(),
          publishedAt: new Date(),
          views: 42,
          likes: 9
        }
      },
      { upsert: true, new: true }
    );

    let conversation = await Conversation.findOne({
      participantIds: { $all: [doctor._id, patient._id] }
    });

    if (!conversation) {
      conversation = await Conversation.create({
        participantIds: [doctor._id, patient._id],
        lastMessageAt: new Date()
      });
    }

    if ((await Message.countDocuments({ conversationId: conversation._id })) === 0) {
      await Message.create({
        conversationId: conversation._id,
        senderId: doctor._id,
        messageType: 'text',
        text: 'Please continue daily BP tracking and share updates in 3 days.',
        readBy: [doctor._id]
      });
    }

    await Notification.findOneAndUpdate(
      {
        userId: patient._id,
        type: 'appointment',
        title: 'Appointment Confirmed'
      },
      {
        $setOnInsert: {
          body: 'Your appointment with Dr Sarah Khan is confirmed for 2026-04-15 at 11:00.',
          isRead: false,
          metadata: { appointmentId: appointment._id }
        }
      },
      { upsert: true, new: true }
    );

    await AuditLog.findOneAndUpdate(
      {
        actorId: admin._id,
        action: 'doctor_approved',
        entityType: 'doctorProfile',
        entityId: doctor._id
      },
      {
        $setOnInsert: {
          actorRole: 'admin',
          details: {
            note: 'Seed approval entry for initial environment setup.'
          }
        }
      },
      { upsert: true, new: true }
    );

    const [users, doctors, patients, vitals, appointments, prescriptions, blogs] =
      await Promise.all([
        User.countDocuments(),
        DoctorProfile.countDocuments(),
        PatientProfile.countDocuments(),
        VitalRecord.countDocuments(),
        Appointment.countDocuments(),
        Prescription.countDocuments(),
        Blog.countDocuments()
      ]);

    console.log('[db:seed] Seed completed successfully.');
    console.log(
      `[db:seed] users=${users}, doctorProfiles=${doctors}, patientProfiles=${patients}, vitals=${vitals}, appointments=${appointments}, prescriptions=${prescriptions}, blogs=${blogs}`
    );
    console.log('[db:seed] login users:');
    console.log('  admin@healthmonitorpro.local / Admin@123');
    console.log('  doctor@healthmonitorpro.local / Doctor@123');
    console.log('  patient@healthmonitorpro.local / Patient@123');
  } catch (error) {
    console.error('[db:seed] Failed:', error.message);
    process.exitCode = 1;
  } finally {
    await mongoose.connection.close();
  }
}

seed();
