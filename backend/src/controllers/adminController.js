const mongoose = require('mongoose');

const User = require('../models/User');
const DoctorProfile = require('../models/DoctorProfile');
const Blog = require('../models/Blog');
const VitalRecord = require('../models/VitalRecord');
const Appointment = require('../models/Appointment');
const Prescription = require('../models/Prescription');
const { logAuditSafe } = require('../services/auditService');
const { createNotification } = require('../services/notificationService');

function badRequest(message) {
  const error = new Error(message);
  error.statusCode = 400;
  return error;
}

async function getDashboard(req, res, next) {
  try {
    const [
      totalDoctors,
      pendingDoctors,
      approvedDoctors,
      suspendedDoctors,
      totalPatients,
      totalBlogs,
      pendingBlogs,
      publishedBlogs,
      highRiskVitals,
      activeAppointments,
      totalPrescriptions
    ] = await Promise.all([
      DoctorProfile.countDocuments(),
      DoctorProfile.countDocuments({ approvalStatus: 'pending' }),
      DoctorProfile.countDocuments({ approvalStatus: 'approved' }),
      DoctorProfile.countDocuments({ approvalStatus: 'suspended' }),
      User.countDocuments({ role: 'patient' }),
      Blog.countDocuments(),
      Blog.countDocuments({ status: 'pending_review' }),
      Blog.countDocuments({ status: 'published' }),
      VitalRecord.countDocuments({ riskLevel: 'high' }),
      Appointment.countDocuments({ status: { $in: ['pending', 'confirmed'] } }),
      Prescription.countDocuments()
    ]);

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
      .populate('userId', 'fullName email phone isActive createdAt')
      .sort({ createdAt: -1 })
      .lean();

    res.json({
      success: true,
      data: { doctors }
    });
  } catch (error) {
    next(error);
  }
}

async function getPendingDoctors(req, res, next) {
  try {
    const doctors = await DoctorProfile.find({ approvalStatus: 'pending' })
      .populate('userId', 'fullName email phone isActive createdAt')
      .sort({ createdAt: 1 })
      .lean();

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

async function getAnalyticsOverview(_req, res, next) {
  try {
    const [totalUsers, activeDoctors, totalPatients, totalBlogs, pendingBlogs, highRiskVitals] =
      await Promise.all([
        User.countDocuments(),
        DoctorProfile.countDocuments({ approvalStatus: 'approved' }),
        User.countDocuments({ role: 'patient' }),
        Blog.countDocuments(),
        Blog.countDocuments({ status: 'pending_review' }),
        VitalRecord.countDocuments({ riskLevel: 'high' })
      ]);

    res.json({
      success: true,
      data: {
        totalUsers,
        activeDoctors,
        totalPatients,
        totalBlogs,
        pendingBlogs,
        highRiskVitals
      }
    });
  } catch (error) {
    next(error);
  }
}

async function getAnalyticsGrowth(_req, res, next) {
  try {
    const months = 6;
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth() - (months - 1), 1);

    const [userGrowth, doctorGrowth, patientGrowth, blogGrowth] = await Promise.all([
      User.aggregate([
        { $match: { createdAt: { $gte: start } } },
        {
          $group: {
            _id: {
              year: { $year: '$createdAt' },
              month: { $month: '$createdAt' }
            },
            count: { $sum: 1 }
          }
        },
        { $sort: { '_id.year': 1, '_id.month': 1 } }
      ]),
      DoctorProfile.aggregate([
        { $match: { createdAt: { $gte: start } } },
        {
          $group: {
            _id: {
              year: { $year: '$createdAt' },
              month: { $month: '$createdAt' }
            },
            count: { $sum: 1 }
          }
        },
        { $sort: { '_id.year': 1, '_id.month': 1 } }
      ]),
      User.aggregate([
        { $match: { role: 'patient', createdAt: { $gte: start } } },
        {
          $group: {
            _id: {
              year: { $year: '$createdAt' },
              month: { $month: '$createdAt' }
            },
            count: { $sum: 1 }
          }
        },
        { $sort: { '_id.year': 1, '_id.month': 1 } }
      ]),
      Blog.aggregate([
        { $match: { createdAt: { $gte: start } } },
        {
          $group: {
            _id: {
              year: { $year: '$createdAt' },
              month: { $month: '$createdAt' }
            },
            count: { $sum: 1 }
          }
        },
        { $sort: { '_id.year': 1, '_id.month': 1 } }
      ])
    ]);

    res.json({
      success: true,
      data: {
        periodMonths: months,
        users: userGrowth,
        doctors: doctorGrowth,
        patients: patientGrowth,
        blogs: blogGrowth
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

module.exports = {
  getDashboard,
  getDoctors,
  getPendingDoctors,
  approveDoctor,
  rejectDoctor,
  suspendDoctor,
  getBlogs,
  getPendingBlogs,
  publishBlog,
  rejectBlog,
  createBlog,
  updateBlog,
  getAnalyticsOverview,
  getAnalyticsGrowth,
  getAnalyticsBlogs
};
