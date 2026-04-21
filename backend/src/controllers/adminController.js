const mongoose = require('mongoose');

const User = require('../models/User');
const DoctorProfile = require('../models/DoctorProfile');
const PatientProfile = require('../models/PatientProfile');
const Blog = require('../models/Blog');
const VitalRecord = require('../models/VitalRecord');
const Appointment = require('../models/Appointment');
const Prescription = require('../models/Prescription');
const AuditLog = require('../models/AuditLog');
const Notification = require('../models/Notification');
const { logAuditSafe } = require('../services/auditService');
const { createNotification } = require('../services/notificationService');

function badRequest(message) {
  const error = new Error(message);
  error.statusCode = 400;
  return error;
}

function scheduleToText(availabilitySchedule) {
  if (!Array.isArray(availabilitySchedule) || availabilitySchedule.length === 0) {
    return undefined;
  }

  return availabilitySchedule
    .map((slot) => `${slot.day}: ${slot.startTime}-${slot.endTime}`)
    .join('; ');
}

async function getDashboard(req, res, next) {
  try {
    const [
      doctorStatusCounts,
      totalDoctors,
      totalPatients,
      totalBlogs,
      pendingBlogs,
      publishedBlogs,
      highRiskVitals,
      activeAppointments,
      totalPrescriptions
    ] = await Promise.all([
      DoctorProfile.aggregate([
        {
          $lookup: {
            from: 'users',
            localField: 'userId',
            foreignField: '_id',
            as: 'user'
          }
        },
        { $unwind: '$user' },
        { $match: { 'user.role': 'doctor' } },
        {
          $group: {
            _id: '$approvalStatus',
            count: { $sum: 1 }
          }
        }
      ]),
      User.countDocuments({ role: 'doctor', isActive: true }),
      User.countDocuments({ role: 'patient', isActive: true }),
      Blog.countDocuments(),
      Blog.countDocuments({ status: 'pending_review' }),
      Blog.countDocuments({ status: 'published' }),
      VitalRecord.countDocuments({ riskLevel: 'high' }),
      Appointment.countDocuments({ status: { $in: ['pending', 'confirmed'] } }),
      Prescription.countDocuments()
    ]);

    const doctorStatusMap = new Map(doctorStatusCounts.map((item) => [String(item._id), item.count]));
    const pendingDoctors = doctorStatusMap.get('pending') || 0;
    const approvedDoctors = doctorStatusMap.get('approved') || 0;
    const suspendedDoctors = doctorStatusMap.get('suspended') || 0;

    res.json({
      success: true,
      data: {
        doctors: {
          total: totalDoctors,
          pending: pendingDoctors,
          approved: approvedDoctors,
          suspended: suspendedDoctors
        },
        patients: {
          total: totalPatients
        },
        blogs: {
          total: totalBlogs,
          pending: pendingBlogs,
          published: publishedBlogs
        },
        clinical: {
          highRiskVitals,
          activeAppointments,
          totalPrescriptions
        }
      }
    });
  } catch (error) {
    next(error);
  }
}

async function getDoctors(req, res, next) {
  try {
    const doctors = await DoctorProfile.find()
      .populate({ path: 'userId', select: 'fullName email phone isActive createdAt role', match: { role: 'doctor' } })
      .sort({ createdAt: -1 })
      .lean();

    const filteredDoctors = doctors.filter((doctor) => doctor.userId);

    res.json({
      success: true,
      data: { doctors: filteredDoctors }
    });
  } catch (error) {
    next(error);
  }
}

async function updateDoctor(req, res, next) {
  try {
    const adminId = req.user.id;
    const { doctorId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(doctorId)) {
      throw badRequest('Invalid doctorId');
    }

    const [user, profile] = await Promise.all([
      User.findOne({ _id: doctorId, role: 'doctor' }),
      DoctorProfile.findOne({ userId: doctorId })
    ]);

    if (!user || !profile) {
      const error = new Error('Doctor not found');
      error.statusCode = 404;
      throw error;
    }

    const {
      fullName,
      email,
      phone,
      specialization,
      licenseNumber,
      qualifications,
      experienceYears,
      hospital,
      fee,
      bio,
      availability,
      availabilitySchedule,
      legalDocuments,
      approvalStatus,
      isActive
    } = req.body;

    if (fullName !== undefined) user.fullName = String(fullName).trim();
    if (email !== undefined) user.email = String(email).trim().toLowerCase();
    if (phone !== undefined) user.phone = String(phone).trim();
    if (isActive !== undefined) user.isActive = Boolean(isActive);

    if (specialization !== undefined) profile.specialization = specialization;
    if (licenseNumber !== undefined) profile.licenseNumber = licenseNumber;
    if (qualifications !== undefined) profile.qualifications = qualifications;
    if (experienceYears !== undefined) profile.experienceYears = experienceYears;
    if (hospital !== undefined) profile.hospital = hospital;
    if (fee !== undefined) profile.fee = fee;
    if (bio !== undefined) profile.bio = bio;
    if (availability !== undefined) profile.availability = availability;
    if (Array.isArray(availabilitySchedule)) {
      profile.availabilitySchedule = availabilitySchedule;
      if (availability === undefined) {
        profile.availability = scheduleToText(availabilitySchedule);
      }
    }
    if (Array.isArray(legalDocuments)) {
      profile.legalDocuments = legalDocuments;
    }
    if (approvalStatus !== undefined) {
      profile.approvalStatus = approvalStatus;
      profile.approvedBy = adminId;
      profile.approvedAt = new Date();
    }

    await Promise.all([user.save(), profile.save()]);

    await logAuditSafe({
      actorId: adminId,
      actorRole: 'admin',
      action: 'doctor_updated',
      entityType: 'doctorProfile',
      entityId: profile._id,
      details: {
        doctorId
      }
    });

    const updatedDoctor = await DoctorProfile.findOne({ userId: doctorId })
      .populate('userId', 'fullName email phone isActive createdAt role')
      .lean();

    res.json({
      success: true,
      message: 'Doctor updated successfully',
      data: {
        doctor: updatedDoctor
      }
    });
  } catch (error) {
    next(error);
  }
}

async function getPatients(req, res, next) {
  try {
    const profilesRaw = await PatientProfile.find()
      .populate({
        path: 'userId',
        select: 'fullName email phone isActive createdAt role',
        match: { role: 'patient' }
      })
      .sort({ updatedAt: -1 })
      .lean();

    const profiles = profilesRaw.filter((item) => item.userId);

    const patientIds = profiles
      .map((item) => item.userId && item.userId._id)
      .filter(Boolean);

    const [highRiskCounts, appointmentCounts] = await Promise.all([
      VitalRecord.aggregate([
        { $match: { patientId: { $in: patientIds }, riskLevel: 'high' } },
        { $group: { _id: '$patientId', count: { $sum: 1 } } }
      ]),
      Appointment.aggregate([
        { $match: { patientId: { $in: patientIds } } },
        { $group: { _id: '$patientId', count: { $sum: 1 } } }
      ])
    ]);

    const riskMap = new Map(highRiskCounts.map((item) => [String(item._id), item.count]));
    const appointmentMap = new Map(appointmentCounts.map((item) => [String(item._id), item.count]));

    const patients = profiles.map((profile) => {
      const user = profile.userId || {};
      const patientId = String(user._id || '');

      return {
        profileId: profile._id,
        patientId,
        user,
        profile,
        highRiskEvents: riskMap.get(patientId) || 0,
        appointmentCount: appointmentMap.get(patientId) || 0
      };
    });

    res.json({
      success: true,
      data: { patients }
    });
  } catch (error) {
    next(error);
  }
}

async function updatePatient(req, res, next) {
  try {
    const adminId = req.user.id;
    const { patientId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(patientId)) {
      throw badRequest('Invalid patientId');
    }

    const [user, profile] = await Promise.all([
      User.findOne({ _id: patientId, role: 'patient' }),
      PatientProfile.findOne({ userId: patientId })
    ]);

    if (!user || !profile) {
      const error = new Error('Patient not found');
      error.statusCode = 404;
      throw error;
    }

    const {
      fullName,
      email,
      phone,
      isActive,
      dob,
      gender,
      bloodGroup,
      heightCm,
      weightKg,
      allergies,
      medications,
      medicalHistory,
      emergencyContact
    } = req.body;

    if (fullName !== undefined) user.fullName = String(fullName).trim();
    if (email !== undefined) user.email = String(email).trim().toLowerCase();
    if (phone !== undefined) user.phone = String(phone).trim();
    if (isActive !== undefined) user.isActive = Boolean(isActive);

    if (dob !== undefined) profile.dob = dob;
    if (gender !== undefined) profile.gender = gender;
    if (bloodGroup !== undefined) profile.bloodGroup = bloodGroup;
    if (heightCm !== undefined) profile.heightCm = heightCm;
    if (weightKg !== undefined) profile.weightKg = weightKg;
    if (allergies !== undefined) profile.allergies = allergies;
    if (medications !== undefined) profile.medications = medications;
    if (medicalHistory !== undefined) profile.medicalHistory = medicalHistory;
    if (emergencyContact !== undefined) profile.emergencyContact = emergencyContact;

    await Promise.all([user.save(), profile.save()]);

    await logAuditSafe({
      actorId: adminId,
      actorRole: 'admin',
      action: 'patient_updated',
      entityType: 'patientProfile',
      entityId: profile._id,
      details: {
        patientId
      }
    });

    const refreshedProfile = await PatientProfile.findOne({ userId: patientId })
      .populate('userId', 'fullName email phone isActive createdAt role')
      .lean();

    res.json({
      success: true,
      message: 'Patient updated successfully',
      data: {
        patient: {
          profileId: refreshedProfile._id,
          patientId,
          user: refreshedProfile.userId,
          profile: refreshedProfile
        }
      }
    });
  } catch (error) {
    next(error);
  }
}

async function deletePatient(req, res, next) {
  try {
    const adminId = req.user.id;
    const { patientId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(patientId)) {
      throw badRequest('Invalid patientId');
    }

    const [user, profile] = await Promise.all([
      User.findOne({ _id: patientId, role: 'patient' }),
      PatientProfile.findOne({ userId: patientId })
    ]);

    if (!user || !profile) {
      const error = new Error('Patient not found');
      error.statusCode = 404;
      throw error;
    }

    await Promise.all([
      PatientProfile.deleteOne({ userId: patientId }),
      User.deleteOne({ _id: patientId }),
      VitalRecord.deleteMany({ patientId }),
      Appointment.deleteMany({ patientId }),
      Prescription.deleteMany({ patientId }),
      Notification.deleteMany({ userId: patientId })
    ]);

    await logAuditSafe({
      actorId: adminId,
      actorRole: 'admin',
      action: 'patient_deleted',
      entityType: 'patientProfile',
      entityId: profile._id,
      details: {
        patientId,
        patientEmail: user.email
      }
    });

    res.json({
      success: true,
      message: 'Patient deleted successfully'
    });
  } catch (error) {
    next(error);
  }
}

async function getPendingDoctors(req, res, next) {
  try {
    const doctorsRaw = await DoctorProfile.find({ approvalStatus: 'pending' })
      .populate({
        path: 'userId',
        select: 'fullName email phone isActive createdAt role',
        match: { role: 'doctor' }
      })
      .sort({ createdAt: 1 })
      .lean();

    const doctors = doctorsRaw.filter((doctor) => doctor.userId);

    res.json({
      success: true,
      data: { doctors }
    });
  } catch (error) {
    next(error);
  }
}

async function approveDoctor(req, res, next) {
  try {
    const adminId = req.user.id;
    const { doctorId } = req.params;
    const { note } = req.body;

    if (!mongoose.Types.ObjectId.isValid(doctorId)) {
      throw badRequest('Invalid doctorId');
    }

    const user = await User.findOne({ _id: doctorId, role: 'doctor' });
    if (!user) {
      const error = new Error('Doctor not found');
      error.statusCode = 404;
      throw error;
    }

    const profile = await DoctorProfile.findOne({ userId: doctorId });
    if (!profile) {
      const error = new Error('Doctor profile not found');
      error.statusCode = 404;
      throw error;
    }

    user.isActive = true;
    profile.approvalStatus = 'approved';
    profile.approvalNote = note ? String(note).trim() : 'Approved by admin';
    profile.approvedBy = adminId;
    profile.approvedAt = new Date();

    await Promise.all([user.save(), profile.save()]);
    await logAuditSafe({
      actorId: adminId,
      actorRole: 'admin',
      action: 'doctor_approved',
      entityType: 'doctorProfile',
      entityId: profile._id,
      details: {
        doctorId,
        note: profile.approvalNote
      }
    });
    await createNotification({
      userId: doctorId,
      type: 'doctor_approval',
      title: 'Doctor Account Approved',
      body: profile.approvalNote,
      metadata: { status: 'approved' }
    });

    res.json({
      success: true,
      message: 'Doctor approved successfully',
      data: { doctor: profile }
    });
  } catch (error) {
    next(error);
  }
}

async function rejectDoctor(req, res, next) {
  try {
    const adminId = req.user.id;
    const { doctorId } = req.params;
    const { note } = req.body;

    if (!mongoose.Types.ObjectId.isValid(doctorId)) {
      throw badRequest('Invalid doctorId');
    }

    const profile = await DoctorProfile.findOne({ userId: doctorId });
    if (!profile) {
      const error = new Error('Doctor profile not found');
      error.statusCode = 404;
      throw error;
    }

    profile.approvalStatus = 'rejected';
    profile.approvalNote = note ? String(note).trim() : 'Rejected by admin';
    profile.approvedBy = adminId;
    profile.approvedAt = new Date();
    await profile.save();

    await logAuditSafe({
      actorId: adminId,
      actorRole: 'admin',
      action: 'doctor_rejected',
      entityType: 'doctorProfile',
      entityId: profile._id,
      details: {
        doctorId,
        note: profile.approvalNote
      }
    });
    await createNotification({
      userId: doctorId,
      type: 'doctor_approval',
      title: 'Doctor Account Rejected',
      body: profile.approvalNote,
      metadata: { status: 'rejected' }
    });

    res.json({
      success: true,
      message: 'Doctor rejected successfully',
      data: { doctor: profile }
    });
  } catch (error) {
    next(error);
  }
}

async function suspendDoctor(req, res, next) {
  try {
    const adminId = req.user.id;
    const { doctorId } = req.params;
    const { note } = req.body;

    if (!mongoose.Types.ObjectId.isValid(doctorId)) {
      throw badRequest('Invalid doctorId');
    }

    const [user, profile] = await Promise.all([
      User.findOne({ _id: doctorId, role: 'doctor' }),
      DoctorProfile.findOne({ userId: doctorId })
    ]);

    if (!user || !profile) {
      const error = new Error('Doctor not found');
      error.statusCode = 404;
      throw error;
    }

    user.isActive = false;
    profile.approvalStatus = 'suspended';
    profile.approvalNote = note ? String(note).trim() : 'Suspended by admin';
    profile.approvedBy = adminId;
    profile.approvedAt = new Date();

    await Promise.all([user.save(), profile.save()]);
    await logAuditSafe({
      actorId: adminId,
      actorRole: 'admin',
      action: 'doctor_suspended',
      entityType: 'doctorProfile',
      entityId: profile._id,
      details: {
        doctorId,
        note: profile.approvalNote
      }
    });
    await createNotification({
      userId: doctorId,
      type: 'doctor_approval',
      title: 'Doctor Account Suspended',
      body: profile.approvalNote,
      metadata: { status: 'suspended' }
    });

    res.json({
      success: true,
      message: 'Doctor suspended successfully',
      data: { doctor: profile }
    });
  } catch (error) {
    next(error);
  }
}

async function deleteDoctor(req, res, next) {
  try {
    const adminId = req.user.id;
    const { doctorId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(doctorId)) {
      throw badRequest('Invalid doctorId');
    }

    const [user, profile] = await Promise.all([
      User.findOne({ _id: doctorId, role: 'doctor' }),
      DoctorProfile.findOne({ userId: doctorId })
    ]);

    if (!user || !profile) {
      const error = new Error('Doctor not found');
      error.statusCode = 404;
      throw error;
    }

    await Promise.all([
      DoctorProfile.deleteOne({ _id: profile._id }),
      User.deleteOne({ _id: user._id })
    ]);

    await logAuditSafe({
      actorId: adminId,
      actorRole: 'admin',
      action: 'doctor_deleted',
      entityType: 'doctorProfile',
      entityId: profile._id,
      details: {
        doctorId,
        doctorEmail: user.email
      }
    });

    res.json({
      success: true,
      message: 'Doctor deleted successfully'
    });
  } catch (error) {
    next(error);
  }
}

async function getBlogs(req, res, next) {
  try {
    const blogs = await Blog.find()
      .populate('authorId', 'fullName email role')
      .sort({ createdAt: -1 })
      .lean();

    res.json({
      success: true,
      data: { blogs }
    });
  } catch (error) {
    next(error);
  }
}

async function getPendingBlogs(req, res, next) {
  try {
    const blogs = await Blog.find({ status: 'pending_review' })
      .populate('authorId', 'fullName email role')
      .sort({ submittedAt: 1 })
      .lean();

    res.json({
      success: true,
      data: { blogs }
    });
  } catch (error) {
    next(error);
  }
}

async function publishBlog(req, res, next) {
  try {
    const adminId = req.user.id;
    const { blogId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(blogId)) {
      throw badRequest('Invalid blogId');
    }

    const blog = await Blog.findById(blogId);
    if (!blog) {
      const error = new Error('Blog not found');
      error.statusCode = 404;
      throw error;
    }

    blog.status = 'published';
    blog.publishedAt = new Date();
    blog.rejectionReason = undefined;
    await blog.save();

    await logAuditSafe({
      actorId: adminId,
      actorRole: 'admin',
      action: 'blog_published',
      entityType: 'blog',
      entityId: blog._id,
      details: { blogId }
    });
    await createNotification({
      userId: blog.authorId,
      type: 'blog_moderation',
      title: 'Blog Published',
      body: `Your blog \"${blog.title}\" has been published.`,
      metadata: { blogId: String(blog._id), status: 'published' }
    });

    res.json({
      success: true,
      message: 'Blog published successfully',
      data: { blog }
    });
  } catch (error) {
    next(error);
  }
}

async function rejectBlog(req, res, next) {
  try {
    const adminId = req.user.id;
    const { blogId } = req.params;
    const { reason } = req.body;

    if (!mongoose.Types.ObjectId.isValid(blogId)) {
      throw badRequest('Invalid blogId');
    }

    const blog = await Blog.findById(blogId);
    if (!blog) {
      const error = new Error('Blog not found');
      error.statusCode = 404;
      throw error;
    }

    blog.status = 'rejected';
    blog.rejectionReason = reason ? String(reason).trim() : 'Rejected by admin';
    await blog.save();

    await logAuditSafe({
      actorId: adminId,
      actorRole: 'admin',
      action: 'blog_rejected',
      entityType: 'blog',
      entityId: blog._id,
      details: {
        blogId,
        reason: blog.rejectionReason
      }
    });
    await createNotification({
      userId: blog.authorId,
      type: 'blog_moderation',
      title: 'Blog Rejected',
      body: blog.rejectionReason,
      metadata: { blogId: String(blog._id), status: 'rejected' }
    });

    res.json({
      success: true,
      message: 'Blog rejected successfully',
      data: { blog }
    });
  } catch (error) {
    next(error);
  }
}

async function createBlog(req, res, next) {
  try {
    const adminId = req.user.id;
    const { title, excerpt, content, coverImageUrl, category, tags, status } = req.body;

    if (!title || !content) {
      throw badRequest('title and content are required');
    }

    const blog = await Blog.create({
      authorId: adminId,
      authorRole: 'admin',
      title,
      excerpt,
      content,
      coverImageUrl,
      category,
      tags: Array.isArray(tags) ? tags : [],
      status: status || 'published',
      submittedAt: status === 'pending_review' ? new Date() : undefined,
      publishedAt: status === 'published' || !status ? new Date() : undefined
    });

    await logAuditSafe({
      actorId: adminId,
      actorRole: 'admin',
      action: 'blog_created',
      entityType: 'blog',
      entityId: blog._id,
      details: { blogId: blog._id }
    });

    res.status(201).json({
      success: true,
      message: 'Admin blog created successfully',
      data: { blog }
    });
  } catch (error) {
    next(error);
  }
}

async function updateBlog(req, res, next) {
  try {
    const adminId = req.user.id;
    const { blogId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(blogId)) {
      throw badRequest('Invalid blogId');
    }

    const blog = await Blog.findById(blogId);
    if (!blog) {
      const error = new Error('Blog not found');
      error.statusCode = 404;
      throw error;
    }

    const allowedFields = [
      'title',
      'excerpt',
      'content',
      'coverImageUrl',
      'category',
      'tags',
      'status',
      'rejectionReason'
    ];
    for (const field of allowedFields) {
      if (Object.prototype.hasOwnProperty.call(req.body, field)) {
        blog[field] = req.body[field];
      }
    }

    if (blog.status === 'published' && !blog.publishedAt) {
      blog.publishedAt = new Date();
    }

    await blog.save();

    await logAuditSafe({
      actorId: adminId,
      actorRole: 'admin',
      action: 'blog_updated',
      entityType: 'blog',
      entityId: blog._id,
      details: { blogId }
    });

    res.json({
      success: true,
      message: 'Blog updated successfully',
      data: { blog }
    });
  } catch (error) {
    next(error);
  }
}

async function deleteBlog(req, res, next) {
  try {
    const adminId = req.user.id;
    const { blogId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(blogId)) {
      throw badRequest('Invalid blogId');
    }

    const blog = await Blog.findById(blogId);
    if (!blog) {
      const error = new Error('Blog not found');
      error.statusCode = 404;
      throw error;
    }

    await Blog.deleteOne({ _id: blog._id });

    await logAuditSafe({
      actorId: adminId,
      actorRole: 'admin',
      action: 'blog_deleted',
      entityType: 'blog',
      entityId: blog._id,
      details: { blogId, title: blog.title }
    });

    res.json({
      success: true,
      message: 'Blog deleted successfully'
    });
  } catch (error) {
    next(error);
  }
}

async function getAppointments(req, res, next) {
  try {
    const appointments = await Appointment.find()
      .sort({ createdAt: -1 })
      .populate('doctorId', 'fullName email phone')
      .populate('patientId', 'fullName email phone')
      .lean();

    res.json({
      success: true,
      data: { appointments }
    });
  } catch (error) {
    next(error);
  }
}

async function getRecentActivity(_req, res, next) {
  try {
    const activities = await AuditLog.find()
      .sort({ createdAt: -1 })
      .limit(50)
      .populate('actorId', 'fullName role email')
      .lean();

    res.json({
      success: true,
      data: { activities }
    });
  } catch (error) {
    next(error);
  }
}

function parseRangeDays(value, fallback = 30) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(365, Math.max(1, Math.floor(parsed)));
}

function toDayKey(date) {
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return null;
  const year = d.getUTCFullYear();
  const month = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function buildSeries(keys, pointsMap) {
  return keys.map((key) => ({
    date: key,
    count: pointsMap.get(key) || 0
  }));
}

function buildRangeKeys(days) {
  const keys = [];
  const now = new Date();
  for (let offset = days - 1; offset >= 0; offset -= 1) {
    const current = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
    current.setUTCDate(current.getUTCDate() - offset);
    keys.push(toDayKey(current));
  }
  return keys.filter(Boolean);
}

function pointsToMap(points) {
  const map = new Map();
  for (const item of points) {
    const key = toDayKey(item._id);
    if (!key) continue;
    map.set(key, item.count || 0);
  }
  return map;
}

async function getAnalyticsOverview(_req, res, next) {
  try {
    const days = parseRangeDays(_req.query.days, 30);
    const now = new Date();
    const start = new Date(now);
    start.setDate(start.getDate() - (days - 1));
    start.setHours(0, 0, 0, 0);

    const [
      totalUsers,
      activeDoctors,
      totalPatients,
      totalBlogs,
      pendingBlogs,
      highRiskVitals,
      newPatients,
      newDoctors,
      vitalsLogged,
      appointmentsCompleted,
      blogsPublished
    ] =
      await Promise.all([
        User.countDocuments({ role: { $in: ['patient', 'doctor'] }, isActive: true }),
        User.countDocuments({ role: 'doctor', isActive: true }),
        User.countDocuments({ role: 'patient', isActive: true }),
        Blog.countDocuments(),
        Blog.countDocuments({ status: 'pending_review' }),
        VitalRecord.countDocuments({ riskLevel: 'high' }),
        User.countDocuments({ role: 'patient', createdAt: { $gte: start } }),
        User.countDocuments({ role: 'doctor', createdAt: { $gte: start } }),
        VitalRecord.countDocuments({ createdAt: { $gte: start } }),
        Appointment.countDocuments({ status: 'completed', updatedAt: { $gte: start } }),
        Blog.countDocuments({ status: 'published', publishedAt: { $gte: start } })
      ]);

    res.json({
      success: true,
      data: {
        days,
        totalUsers,
        activeDoctors,
        totalPatients,
        totalBlogs,
        pendingBlogs,
        highRiskVitals,
        headlineKpis: {
          newPatients,
          newDoctors,
          vitalsLogged,
          appointmentsCompleted,
          blogsPublished
        }
      }
    });
  } catch (error) {
    next(error);
  }
}

async function getAnalyticsGrowth(_req, res, next) {
  try {
    const days = parseRangeDays(_req.query.days, 30);
    const now = new Date();
    const start = new Date(now);
    start.setDate(start.getDate() - (days - 1));
    start.setHours(0, 0, 0, 0);

    const [doctorSeriesRaw, patientSeriesRaw, vitalsSeriesRaw] = await Promise.all([
      User.aggregate([
        { $match: { role: 'doctor', createdAt: { $gte: start } } },
        {
          $group: {
            _id: {
              $dateTrunc: { date: '$createdAt', unit: 'day' }
            },
            count: { $sum: 1 }
          }
        },
        { $sort: { _id: 1 } }
      ]),
      User.aggregate([
        { $match: { role: 'patient', createdAt: { $gte: start } } },
        {
          $group: {
            _id: {
              $dateTrunc: { date: '$createdAt', unit: 'day' }
            },
            count: { $sum: 1 }
          }
        },
        { $sort: { _id: 1 } }
      ]),
      VitalRecord.aggregate([
        { $match: { createdAt: { $gte: start } } },
        {
          $group: {
            _id: {
              $dateTrunc: { date: '$createdAt', unit: 'day' }
            },
            count: { $sum: 1 }
          }
        },
        { $sort: { _id: 1 } }
      ])
    ]);

    const keys = buildRangeKeys(days);

    const doctorsDaily = buildSeries(keys, pointsToMap(doctorSeriesRaw));
    const patientsDaily = buildSeries(keys, pointsToMap(patientSeriesRaw));
    const vitalsDaily = buildSeries(keys, pointsToMap(vitalsSeriesRaw));

    let doctorRunning = 0;
    let patientRunning = 0;

    const cumulative = keys.map((key) => {
      doctorRunning += pointsToMap(doctorSeriesRaw).get(key) || 0;
      patientRunning += pointsToMap(patientSeriesRaw).get(key) || 0;
      return {
        date: key,
        doctors: doctorRunning,
        patients: patientRunning
      };
    });

    res.json({
      success: true,
      data: {
        days,
        cumulative,
        doctorsDaily,
        patientsDaily,
        vitalsDaily
      }
    });
  } catch (error) {
    next(error);
  }
}

async function getAnalyticsBlogs(_req, res, next) {
  try {
    const [statusBreakdown, categoryBreakdown, topBlogs] = await Promise.all([
      Blog.aggregate([
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 }
          }
        },
        { $sort: { count: -1 } }
      ]),
      Blog.aggregate([
        {
          $group: {
            _id: { $ifNull: ['$category', 'uncategorized'] },
            count: { $sum: 1 }
          }
        },
        { $sort: { count: -1 } },
        { $limit: 10 }
      ]),
      Blog.find({ status: 'published' })
        .sort({ views: -1, likes: -1 })
        .limit(10)
        .select('title views likes category status publishedAt')
        .lean()
    ]);

    res.json({
      success: true,
      data: {
        statusBreakdown,
        categoryBreakdown,
        topBlogs
      }
    });
  } catch (error) {
    next(error);
  }
}

async function getAnalyticsPerformance(_req, res, next) {
  try {
    const [topDoctors, appointmentFunnel, riskDistribution] = await Promise.all([
      Appointment.aggregate([
        {
          $group: {
            _id: '$doctorId',
            appointments: { $sum: 1 },
            completed: {
              $sum: {
                $cond: [{ $eq: ['$status', 'completed'] }, 1, 0]
              }
            },
            patients: { $addToSet: '$patientId' }
          }
        },
        {
          $project: {
            doctorId: '$_id',
            appointments: 1,
            completed: 1,
            patientsCount: { $size: '$patients' }
          }
        },
        { $sort: { appointments: -1 } },
        { $limit: 5 },
        {
          $lookup: {
            from: 'users',
            localField: 'doctorId',
            foreignField: '_id',
            as: 'doctorUser'
          }
        },
        {
          $lookup: {
            from: 'doctorprofiles',
            localField: 'doctorId',
            foreignField: 'userId',
            as: 'doctorProfile'
          }
        },
        {
          $project: {
            doctorId: 1,
            appointments: 1,
            completed: 1,
            patientsCount: 1,
            user: { $arrayElemAt: ['$doctorUser', 0] },
            profile: { $arrayElemAt: ['$doctorProfile', 0] }
          }
        }
      ]),
      Appointment.aggregate([
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 }
          }
        }
      ]),
      VitalRecord.aggregate([
        {
          $match: {
            datetime: {
              $gte: new Date(new Date().setHours(0, 0, 0, 0))
            }
          }
        },
        {
          $group: {
            _id: '$riskLevel',
            count: { $sum: 1 }
          }
        }
      ])
    ]);

    const funnelMap = new Map(appointmentFunnel.map((item) => [item._id, item.count]));
    const requested =
      (funnelMap.get('pending') || 0) +
      (funnelMap.get('confirmed') || 0) +
      (funnelMap.get('completed') || 0) +
      (funnelMap.get('cancelled') || 0);
    const confirmed = (funnelMap.get('confirmed') || 0) + (funnelMap.get('completed') || 0);
    const completed = funnelMap.get('completed') || 0;
    const cancelled = funnelMap.get('cancelled') || 0;

    const riskMap = new Map(riskDistribution.map((item) => [item._id, item.count]));

    res.json({
      success: true,
      data: {
        topDoctors,
        appointmentFunnel: {
          requested,
          confirmed,
          completed,
          cancelled
        },
        riskDistribution: {
          normal: riskMap.get('normal') || 0,
          medium: riskMap.get('medium') || 0,
          high: riskMap.get('high') || 0
        }
      }
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getDashboard,
  getDoctors,
  updateDoctor,
  getPatients,
  updatePatient,
  deletePatient,
  getPendingDoctors,
  approveDoctor,
  rejectDoctor,
  suspendDoctor,
  deleteDoctor,
  getBlogs,
  getPendingBlogs,
  publishBlog,
  rejectBlog,
  createBlog,
  updateBlog,
  deleteBlog,
  getAppointments,
  getRecentActivity,
  getAnalyticsOverview,
  getAnalyticsGrowth,
  getAnalyticsBlogs,
  getAnalyticsPerformance
};
