const User = require('../models/User');
const DoctorProfile = require('../models/DoctorProfile');

module.exports = async function requireDoctorApproved(req, _res, next) {
  try {
    if (!req.user || req.user.role !== 'doctor') {
      return next();
    }

    const user = await User.findById(req.user.id);
    if (!user || !user.isActive) {
      const error = new Error('Doctor account is inactive');
      error.statusCode = 403;
      return next(error);
    }

    const profile = await DoctorProfile.findOne({ userId: req.user.id });
    if (!profile) {
      const error = new Error('Doctor profile not found');
      error.statusCode = 403;
      return next(error);
    }
    if (profile.approvalStatus !== 'approved') {
      const error = new Error(`Doctor approval status is ${profile.approvalStatus}`);
      error.statusCode = 403;
      return next(error);
    }

    return next();
  } catch (error) {
    return next(error);
  }
};
