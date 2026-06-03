const mongoose = require('mongoose');

const PatientProfile = require('../models/PatientProfile');
const DoctorProfile = require('../models/DoctorProfile');
const User = require('../models/User');
const VitalRecord = require('../models/VitalRecord');
const Appointment = require('../models/Appointment');
const Prescription = require('../models/Prescription');
const { uploadBuffer } = require('../services/s3Service');

function badRequest(message) {
  const error = new Error(message);
  error.statusCode = 400;
  return error;
}

async function ensurePatientProfile(userId) {
  let profile = await PatientProfile.findOne({ userId });
  if (!profile) {
    profile = await PatientProfile.create({ userId, connectedDoctorIds: [] });
  }
  return profile;
}

function badRequest(message) {
  const error = new Error(message);
  error.statusCode = 400;
  return error;
}

async function uploadMedicalDocuments(medicalDocuments) {
  if (!Array.isArray(medicalDocuments) || medicalDocuments.length === 0) {
    return [];
  }

  const uploadedDocuments = [];

  for (const document of medicalDocuments) {
    const rawBase64 = String(document.dataBase64 || '').trim();
    const normalizedBase64 = rawBase64.includes(',') ? rawBase64.split(',').pop() : rawBase64;
    const buffer = Buffer.from(normalizedBase64 || '', 'base64');

    if (!buffer.length) {
      throw badRequest('Invalid medical document payload');
    }

    const upload = await uploadBuffer({
      fileName: document.fileName,
      _buffer: buffer,
      contentType: document.contentType || 'application/pdf'
    });

    uploadedDocuments.push({
      label: document.label ? String(document.label).trim() : undefined,
      fileName: upload.fileName,
      fileUrl: upload.url,
      contentType: upload.contentType,
      uploadedAt: new Date()
    });
  }

  return uploadedDocuments;
}

async function uploadProfilePhoto(profilePhoto) {
  if (!profilePhoto) {
    return undefined;
  }

  const rawBase64 = String(profilePhoto.dataBase64 || '').trim();
  const normalizedBase64 = rawBase64.includes(',') ? rawBase64.split(',').pop() : rawBase64;
  const buffer = Buffer.from(normalizedBase64 || '', 'base64');

  if (!buffer.length) {
    throw badRequest('Invalid profile photo payload');
  }

  const upload = await uploadBuffer({
    fileName: profilePhoto.fileName,
    _buffer: buffer,
    contentType: profilePhoto.contentType || 'image/jpeg'
  });

  return {
    fileName: upload.fileName,
    fileUrl: upload.url,
    contentType: upload.contentType,
    uploadedAt: new Date()
  };
}

async function getMyDashboard(req, res, next) {
  try {
    const patientId = req.user.id;

    await ensurePatientProfile(patientId);

    const [latestVitals, highRiskCount, upcomingAppointments, prescriptionCount] =
      await Promise.all([
        VitalRecord.find({ patientId }).sort({ datetime: -1 }).limit(3).lean(),
        VitalRecord.countDocuments({ patientId, riskLevel: 'high' }),
        Appointment.find({ patientId, status: { $in: ['pending', 'confirmed'] } })
          .sort({ createdAt: -1 })
          .limit(5)
          .populate('doctorId', 'fullName email')
          .lean(),
        Prescription.countDocuments({ patientId })
      ]);

    res.json({
      success: true,
      data: {
        latestVitals,
        metrics: {
          highRiskCount,
          upcomingAppointments: upcomingAppointments.length,
          prescriptionCount
        },
        upcomingAppointments
      }
    });
  } catch (error) {
    next(error);
  }
}

async function getMyProfile(req, res, next) {
  try {
    const patientId = req.user.id;
    const profile = await ensurePatientProfile(patientId);

    res.json({
      success: true,
      data: { profile }
    });
  } catch (error) {
    next(error);
  }
}

async function updateMyProfile(req, res, next) {
  try {
    const patientId = req.user.id;
    const profile = await ensurePatientProfile(patientId);
    const allowedFields = [
      'dob',
      'gender',
      'bloodGroup',
      'heightCm',
      'weightKg',
      'allergies',
      'medications',
      'medicalHistory',
      'emergencyContact'
    ];

    const updatePayload = {};
    for (const field of allowedFields) {
      if (Object.prototype.hasOwnProperty.call(req.body, field)) {
        updatePayload[field] = req.body[field];
      }
    }

    if (Object.prototype.hasOwnProperty.call(req.body, 'medicalDocuments')) {
      const uploadedMedicalDocuments = await uploadMedicalDocuments(req.body.medicalDocuments);
      updatePayload.medicalDocuments = [
        ...(Array.isArray(profile.medicalDocuments) ? profile.medicalDocuments : []),
        ...uploadedMedicalDocuments
      ];
    }

    if (Object.prototype.hasOwnProperty.call(req.body, 'profilePhoto')) {
      updatePayload.profilePhoto = await uploadProfilePhoto(req.body.profilePhoto);
    }

    Object.assign(profile, updatePayload);
    await profile.save();

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: { profile }
    });
  } catch (error) {
    next(error);
  }
}

async function getMyDoctors(req, res, next) {
  try {
    const patientId = req.user.id;
    const profile = await ensurePatientProfile(patientId);

    const doctors = await DoctorProfile.find({
      userId: { $in: profile.connectedDoctorIds },
      approvalStatus: 'approved'
    })
      .populate('userId', 'fullName email phone')
      .lean();

    res.json({
      success: true,
      data: { doctors }
    });
  } catch (error) {
    next(error);
  }
}

async function connectDoctor(req, res, next) {
  try {
    const patientId = req.user.id;
    const { doctorId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(doctorId)) {
      throw badRequest('Invalid doctorId');
    }

    const doctorUser = await User.findOne({ _id: doctorId, role: 'doctor', isActive: true });
    if (!doctorUser) {
      const error = new Error('Doctor not found');
      error.statusCode = 404;
      throw error;
    }

    const doctorProfile = await DoctorProfile.findOne({
      userId: doctorId,
      approvalStatus: 'approved'
    });
    if (!doctorProfile) {
      const error = new Error('Doctor is not approved');
      error.statusCode = 403;
      throw error;
    }

    const profile = await ensurePatientProfile(patientId);
    await PatientProfile.updateOne(
      { _id: profile._id },
      { $addToSet: { connectedDoctorIds: doctorUser._id } }
    );

    const updated = await PatientProfile.findById(profile._id).lean();

    res.json({
      success: true,
      message: 'Doctor connected successfully',
      data: { profile: updated }
    });
  } catch (error) {
    next(error);
  }
}

async function disconnectDoctor(req, res, next) {
  try {
    const patientId = req.user.id;
    const { doctorId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(doctorId)) {
      throw badRequest('Invalid doctorId');
    }

    const profile = await ensurePatientProfile(patientId);
    await PatientProfile.updateOne(
      { _id: profile._id },
      { $pull: { connectedDoctorIds: doctorId } }
    );

    const updated = await PatientProfile.findById(profile._id).lean();

    res.json({
      success: true,
      message: 'Doctor disconnected successfully',
      data: { profile: updated }
    });
  } catch (error) {
    next(error);
  }
}

async function getMyAppointments(req, res, next) {
  try {
    const patientId = req.user.id;

    const appointments = await Appointment.find({ patientId })
      .sort({ createdAt: -1 })
      .populate('doctorId', 'fullName email phone')
      .lean();

    res.json({
      success: true,
      data: { appointments }
    });
  } catch (error) {
    next(error);
  }
}

async function getMyPrescriptions(req, res, next) {
  try {
    const patientId = req.user.id;

    const prescriptions = await Prescription.find({ patientId })
      .sort({ issuedAt: -1 })
      .populate('doctorId', 'fullName email phone')
      .lean();

    res.json({
      success: true,
      data: { prescriptions }
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getMyDashboard,
  getMyProfile,
  updateMyProfile,
  getMyDoctors,
  connectDoctor,
  disconnectDoctor,
  getMyAppointments,
  getMyPrescriptions
};
