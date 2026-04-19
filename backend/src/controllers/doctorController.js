const mongoose = require('mongoose');

const User = require('../models/User');
const PatientProfile = require('../models/PatientProfile');
const VitalRecord = require('../models/VitalRecord');
const Appointment = require('../models/Appointment');
const Prescription = require('../models/Prescription');
const Blog = require('../models/Blog');
const DoctorProfile = require('../models/DoctorProfile');

function badRequest(message) {
  const error = new Error(message);
  error.statusCode = 400;
  return error;
}

async function ensureConnectedPatient(doctorId, patientId) {
  const profile = await PatientProfile.findOne({
    userId: patientId,
    connectedDoctorIds: doctorId
  });

  if (!profile) {
    const error = new Error('Patient is not connected to this doctor');
    error.statusCode = 403;
    throw error;
  }

  return profile;
}

function parseSpecializations(queryValue) {
  if (!queryValue) return [];
  if (Array.isArray(queryValue)) {
    return queryValue
      .flatMap((value) => String(value).split(','))
      .map((value) => value.trim())
      .filter(Boolean);
  }

  return String(queryValue)
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean);
}

function getDayRegex(day) {
  const normalized = String(day || '').trim().toLowerCase();
  if (!normalized) return null;
  const aliases = {
    mon: 'mon(?:day)?',
    tue: 'tue(?:sday)?',
    wed: 'wed(?:nesday)?',
    thu: 'thu(?:rsday)?',
    fri: 'fri(?:day)?',
    sat: 'sat(?:urday)?',
    sun: 'sun(?:day)?'
  };

  const short = normalized.slice(0, 3);
  if (!aliases[short]) return null;
  return new RegExp(aliases[short], 'i');
}

async function getPublicDoctors(req, res, next) {
  try {
    const limit = Math.min(Math.max(Number(req.query.limit || 12), 1), 60);
    const page = Math.max(Number(req.query.page || 1), 1);
    const skip = (page - 1) * limit;

    const search = String(req.query.search || '').trim();
    const specializations = parseSpecializations(req.query.specializations);
    const minFee = req.query.minFee !== undefined ? Number(req.query.minFee) : null;
    const maxFee = req.query.maxFee !== undefined ? Number(req.query.maxFee) : null;
    const minRating = req.query.minRating !== undefined ? Number(req.query.minRating) : null;
    const availabilityDay = req.query.availabilityDay;
    const sort = String(req.query.sort || 'latest');

    const filter = { approvalStatus: 'approved' };

    if (specializations.length > 0) {
      filter.specialization = { $in: specializations };
    }

    const hasMinFee = minFee !== null && !Number.isNaN(minFee);
    const hasMaxFee = maxFee !== null && !Number.isNaN(maxFee);

    if (hasMinFee || hasMaxFee) {
      filter.fee = {};
      if (hasMinFee) filter.fee.$gte = minFee;
      if (hasMaxFee) filter.fee.$lte = maxFee;
    }

    if (!Number.isNaN(minRating) && minRating !== null) {
      filter.rating = { $gte: minRating };
    }

    const dayRegex = getDayRegex(availabilityDay);
    if (dayRegex) {
      filter.availability = { $regex: dayRegex };
    }

    const sortMap = {
      latest: { updatedAt: -1 },
      rating: { rating: -1, reviewsCount: -1, updatedAt: -1 },
      experience: { experienceYears: -1, updatedAt: -1 },
      fee_asc: { fee: 1, updatedAt: -1 },
      fee_desc: { fee: -1, updatedAt: -1 }
    };

    const selectedSort = sortMap[sort] || sortMap.latest;

    const baseQuery = DoctorProfile.find(filter).populate('userId', 'fullName').lean();

    if (search) {
      const regex = new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      const matchedUsers = await User.find({ fullName: { $regex: regex } }).select('_id').lean();
      const matchedUserIds = matchedUsers.map((item) => item._id);

      baseQuery.or([
        { specialization: { $regex: regex } },
        { hospital: { $regex: regex } },
        { userId: { $in: matchedUserIds } }
      ]);
    }

    const total = await DoctorProfile.countDocuments(baseQuery.getFilter());

    const doctors = await DoctorProfile.find(baseQuery.getFilter())
      .populate('userId', 'fullName')
      .sort(selectedSort)
      .skip(skip)
      .limit(limit)
      .lean();

    const allSpecializations = await DoctorProfile.distinct('specialization', { approvalStatus: 'approved' });

    const safeDoctors = doctors.map((profile) => ({
      _id: profile._id,
      userId: profile.userId,
      specialization: profile.specialization,
      qualifications: profile.qualifications,
      experienceYears: profile.experienceYears,
      hospital: profile.hospital,
      fee: profile.fee,
      rating: profile.rating ?? 5,
      reviewsCount: profile.reviewsCount ?? 0,
      bio: profile.bio,
      availability: profile.availability,
      approvalStatus: profile.approvalStatus,
      createdAt: profile.createdAt,
      updatedAt: profile.updatedAt
    }));

    res.json({
      success: true,
      data: {
        doctors: safeDoctors,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.max(Math.ceil(total / limit), 1)
        },
        filters: {
          specializations: allSpecializations.filter(Boolean).sort((a, b) => String(a).localeCompare(String(b)))
        }
      }
    });
  } catch (error) {
    next(error);
  }
}

async function getPublicDoctorById(req, res, next) {
  try {
    const { doctorId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(doctorId)) {
      throw badRequest('Invalid doctorId');
    }

    const profile = await DoctorProfile.findOne({
      userId: doctorId,
      approvalStatus: 'approved'
    })
      .populate('userId', 'fullName')
      .lean();

    if (!profile) {
      const error = new Error('Doctor not found');
      error.statusCode = 404;
      throw error;
    }

    res.json({
      success: true,
      data: {
        doctor: {
          _id: profile._id,
          userId: profile.userId,
          specialization: profile.specialization,
          qualifications: profile.qualifications,
          experienceYears: profile.experienceYears,
          hospital: profile.hospital,
          fee: profile.fee,
          rating: profile.rating ?? 5,
          reviewsCount: profile.reviewsCount ?? 0,
          bio: profile.bio,
          availability: profile.availability,
          approvalStatus: profile.approvalStatus,
          createdAt: profile.createdAt,
          updatedAt: profile.updatedAt
        }
      }
    });
  } catch (error) {
    next(error);
  }
}

async function getPublicTestimonials(req, res, next) {
  try {
    const limit = Math.min(Math.max(Number(req.query.limit || 12), 1), 50);

    const testimonials = await Appointment.find({
      status: 'completed',
      notes: { $exists: true, $ne: '' }
    })
      .sort({ updatedAt: -1 })
      .limit(limit)
      .populate('patientId', 'fullName')
      .populate('doctorId', 'fullName')
      .lean();

    const safeTestimonials = testimonials
      .map((item) => ({
        id: item._id,
        name: item.patientId?.fullName || 'Patient',
        role: item.doctorId?.fullName ? `Patient of ${item.doctorId.fullName}` : 'Patient',
        quote: String(item.notes || '').trim()
      }))
      .filter((item) => item.quote.length > 0);

    res.json({ success: true, data: { testimonials: safeTestimonials } });
  } catch (error) {
    next(error);
  }
}

async function getPublicDoctorReviews(req, res, next) {
  try {
    const { doctorId } = req.params;
    const limit = Math.min(Math.max(Number(req.query.limit || 10), 1), 30);

    if (!mongoose.Types.ObjectId.isValid(doctorId)) {
      throw badRequest('Invalid doctorId');
    }

    const reviews = await Appointment.find({
      doctorId,
      status: 'completed',
      notes: { $exists: true, $ne: '' }
    })
      .sort({ updatedAt: -1 })
      .limit(limit)
      .populate('patientId', 'fullName')
      .lean();

    const safeReviews = reviews
      .map((item, index) => ({
        id: item._id,
        name: item.patientId?.fullName || `Patient ${index + 1}`,
        date: item.updatedAt || item.createdAt,
        quote: String(item.notes || '').trim()
      }))
      .filter((item) => item.quote.length > 0);

    res.json({
      success: true,
      data: {
        reviews: safeReviews
      }
    });
  } catch (error) {
    next(error);
  }
}

async function getMyDashboard(req, res, next) {
  try {
    const doctorId = req.user.id;

    const connectedPatientProfiles = await PatientProfile.find({
      connectedDoctorIds: doctorId
    })
      .select('userId')
      .lean();

    const patientIds = connectedPatientProfiles.map((profile) => profile.userId);

    const [pendingAppointments, completedAppointments, prescriptionCount, draftBlogs] =
      await Promise.all([
        Appointment.countDocuments({
          doctorId,
          status: { $in: ['pending', 'confirmed'] }
        }),
        Appointment.countDocuments({ doctorId, status: 'completed' }),
        Prescription.countDocuments({ doctorId }),
        Blog.countDocuments({ authorId: doctorId, authorRole: 'doctor', status: 'draft' })
      ]);

    let highRiskPatients = 0;
    if (patientIds.length > 0) {
      highRiskPatients = await VitalRecord.distinct('patientId', {
        patientId: { $in: patientIds },
        riskLevel: 'high'
      }).then((ids) => ids.length);
    }

    res.json({
      success: true,
      data: {
        metrics: {
          connectedPatients: patientIds.length,
          highRiskPatients,
          pendingAppointments,
          completedAppointments,
          prescriptionCount,
          draftBlogs
        }
      }
    });
  } catch (error) {
    next(error);
  }
}

async function getMyPatients(req, res, next) {
  try {
    const doctorId = req.user.id;

    const profiles = await PatientProfile.find({ connectedDoctorIds: doctorId })
      .populate('userId', 'fullName email phone isActive createdAt')
      .sort({ updatedAt: -1 })
      .lean();

    res.json({
      success: true,
      data: { patients: profiles }
    });
  } catch (error) {
    next(error);
  }
}

async function getMyPatientDetail(req, res, next) {
  try {
    const doctorId = req.user.id;
    const { patientId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(patientId)) {
      throw badRequest('Invalid patientId');
    }

    const profile = await ensureConnectedPatient(doctorId, patientId);

    const doctorNotes = (profile.doctorNotes || [])
      .filter((entry) => String(entry.doctorId) === String(doctorId))
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    const profileForDoctor = {
      ...profile.toObject(),
      doctorNotes
    };

    const [patientUser, latestVitals, recentAppointments, prescriptionCount] =
      await Promise.all([
        User.findOne({ _id: patientId, role: 'patient' })
          .select('fullName email phone isActive createdAt')
          .lean(),
        VitalRecord.find({ patientId }).sort({ datetime: -1 }).limit(5).lean(),
        Appointment.find({ patientId, doctorId }).sort({ createdAt: -1 }).limit(5).lean(),
        Prescription.countDocuments({ patientId, doctorId })
      ]);

    if (!patientUser) {
      const error = new Error('Patient not found');
      error.statusCode = 404;
      throw error;
    }

    res.json({
      success: true,
      data: {
        patient: {
          user: patientUser,
          profile: profileForDoctor,
          doctorNotes,
          latestVitals,
          recentAppointments,
          prescriptionCount
        }
      }
    });
  } catch (error) {
    next(error);
  }
}

async function addPatientNote(req, res, next) {
  try {
    const doctorId = req.user.id;
    const { patientId } = req.params;
    const { note } = req.body;

    if (!mongoose.Types.ObjectId.isValid(patientId)) {
      throw badRequest('Invalid patientId');
    }

    if (!note || !String(note).trim()) {
      throw badRequest('note is required');
    }

    const profile = await ensureConnectedPatient(doctorId, patientId);
    profile.doctorNotes = profile.doctorNotes || [];
    profile.doctorNotes.push({
      doctorId,
      note: String(note).trim(),
      createdAt: new Date(),
      updatedAt: new Date()
    });
    await profile.save();

    const latestNote = profile.doctorNotes[profile.doctorNotes.length - 1];

    res.status(201).json({
      success: true,
      message: 'Patient note saved successfully',
      data: { note: latestNote }
    });
  } catch (error) {
    next(error);
  }
}

async function getMyProfile(req, res, next) {
  try {
    const doctorId = req.user.id;

    const [user, profile] = await Promise.all([
      User.findOne({ _id: doctorId, role: 'doctor' })
        .select('fullName email phone isActive createdAt updatedAt')
        .lean(),
      DoctorProfile.findOne({ userId: doctorId }).lean()
    ]);

    if (!user || !profile) {
      const error = new Error('Doctor profile not found');
      error.statusCode = 404;
      throw error;
    }

    res.json({
      success: true,
      data: {
        profile: {
          user,
          doctorProfile: profile
        }
      }
    });
  } catch (error) {
    next(error);
  }
}

async function updateMyProfile(req, res, next) {
  try {
    const doctorId = req.user.id;
    const {
      fullName,
      phone,
      specialization,
      qualifications,
      experienceYears,
      hospital,
      fee,
      bio,
      availability
    } = req.body;

    const user = await User.findOne({ _id: doctorId, role: 'doctor' });
    const doctorProfile = await DoctorProfile.findOne({ userId: doctorId });

    if (!user || !doctorProfile) {
      const error = new Error('Doctor profile not found');
      error.statusCode = 404;
      throw error;
    }

    if (fullName !== undefined) user.fullName = String(fullName).trim();
    if (phone !== undefined) user.phone = String(phone).trim();

    const profileFields = {
      specialization,
      qualifications,
      experienceYears,
      hospital,
      fee,
      bio,
      availability
    };

    for (const [key, value] of Object.entries(profileFields)) {
      if (value !== undefined) {
        doctorProfile[key] = value;
      }
    }

    await Promise.all([user.save(), doctorProfile.save()]);

    res.json({
      success: true,
      message: 'Doctor profile updated successfully',
      data: {
        profile: {
          user,
          doctorProfile
        }
      }
    });
  } catch (error) {
    next(error);
  }
}

async function getMyPatientTrends(req, res, next) {
  try {
    const doctorId = req.user.id;
    const { patientId } = req.params;
    const days = Math.min(Math.max(Number(req.query.days || 30), 1), 365);

    if (!mongoose.Types.ObjectId.isValid(patientId)) {
      throw badRequest('Invalid patientId');
    }

    await ensureConnectedPatient(doctorId, patientId);

    const since = new Date();
    since.setDate(since.getDate() - days);

    const vitals = await VitalRecord.find({
      patientId,
      datetime: { $gte: since }
    })
      .sort({ datetime: 1 })
      .lean();

    res.json({
      success: true,
      data: {
        patientId,
        periodDays: days,
        totalRecords: vitals.length,
        vitals
      }
    });
  } catch (error) {
    next(error);
  }
}

async function getMyPrescriptions(req, res, next) {
  try {
    const doctorId = req.user.id;

    const prescriptions = await Prescription.find({ doctorId })
      .sort({ issuedAt: -1 })
      .populate('patientId', 'fullName email phone')
      .lean();

    res.json({
      success: true,
      data: { prescriptions }
    });
  } catch (error) {
    next(error);
  }
}

async function createPatientPrescription(req, res, next) {
  try {
    const doctorId = req.user.id;
    const { patientId } = req.params;
    const { diagnosis, medications, instructions, followUpDate, pdfUrl } = req.body;

    if (!mongoose.Types.ObjectId.isValid(patientId)) {
      throw badRequest('Invalid patientId');
    }

    if (!Array.isArray(medications) || medications.length === 0) {
      throw badRequest('At least one medication is required');
    }

    await ensureConnectedPatient(doctorId, patientId);

    const prescription = await Prescription.create({
      patientId,
      doctorId,
      diagnosis,
      medications,
      instructions,
      followUpDate,
      pdfUrl,
      issuedAt: new Date()
    });

    res.status(201).json({
      success: true,
      message: 'Prescription created successfully',
      data: { prescription }
    });
  } catch (error) {
    next(error);
  }
}

async function getMyBlogs(req, res, next) {
  try {
    const doctorId = req.user.id;

    const blogs = await Blog.find({ authorId: doctorId, authorRole: 'doctor' })
      .sort({ updatedAt: -1 })
      .lean();

    res.json({
      success: true,
      data: { blogs }
    });
  } catch (error) {
    next(error);
  }
}

async function createMyBlog(req, res, next) {
  try {
    const doctorId = req.user.id;
    const { title, excerpt, content, coverImageUrl, category, tags } = req.body;

    if (!title || !content) {
      throw badRequest('title and content are required');
    }

    const blog = await Blog.create({
      authorId: doctorId,
      authorRole: 'doctor',
      title,
      excerpt,
      content,
      coverImageUrl,
      category,
      tags: Array.isArray(tags) ? tags : [],
      status: 'draft'
    });

    res.status(201).json({
      success: true,
      message: 'Blog draft created successfully',
      data: { blog }
    });
  } catch (error) {
    next(error);
  }
}

async function updateMyBlog(req, res, next) {
  try {
    const doctorId = req.user.id;
    const { blogId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(blogId)) {
      throw badRequest('Invalid blogId');
    }

    const blog = await Blog.findOne({ _id: blogId, authorId: doctorId, authorRole: 'doctor' });
    if (!blog) {
      const error = new Error('Blog not found');
      error.statusCode = 404;
      throw error;
    }

    const previousStatus = blog.status;

    const allowedFields = ['title', 'excerpt', 'content', 'coverImageUrl', 'category', 'tags'];
    for (const field of allowedFields) {
      if (Object.prototype.hasOwnProperty.call(req.body, field)) {
        blog[field] = req.body[field];
      }
    }

    if (previousStatus !== 'draft') {
      // Any edit after moderation must return to draft and be re-submitted.
      blog.status = 'draft';
      blog.submittedAt = undefined;
      blog.publishedAt = undefined;
      blog.rejectionReason = undefined;
    }

    await blog.save();

    res.json({
      success: true,
      message: 'Blog updated successfully',
      data: { blog }
    });
  } catch (error) {
    next(error);
  }
}

async function submitMyBlog(req, res, next) {
  try {
    const doctorId = req.user.id;
    const { blogId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(blogId)) {
      throw badRequest('Invalid blogId');
    }

    const blog = await Blog.findOne({ _id: blogId, authorId: doctorId, authorRole: 'doctor' });
    if (!blog) {
      const error = new Error('Blog not found');
      error.statusCode = 404;
      throw error;
    }

    if (!blog.title || !blog.content) {
      throw badRequest('Blog must have title and content before submit');
    }

    blog.status = 'pending_review';
    blog.submittedAt = new Date();
    await blog.save();

    res.json({
      success: true,
      message: 'Blog submitted for review',
      data: { blog }
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getPublicDoctors,
  getPublicDoctorById,
  getPublicTestimonials,
  getPublicDoctorReviews,
  getMyDashboard,
  getMyPatients,
  getMyPatientDetail,
  getMyPatientTrends,
  addPatientNote,
  getMyProfile,
  updateMyProfile,
  getMyPrescriptions,
  createPatientPrescription,
  getMyBlogs,
  createMyBlog,
  updateMyBlog,
  submitMyBlog
};
