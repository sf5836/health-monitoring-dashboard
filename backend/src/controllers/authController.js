const User = require('../models/User');
const PatientProfile = require('../models/PatientProfile');
const DoctorProfile = require('../models/DoctorProfile');
const {
  signAccessToken,
  issueRefreshToken,
  rotateRefreshToken,
  revokeRefreshToken,
  verifyRefreshToken,
  hashPassword,
  verifyPassword
} = require('../services/authService');

function badRequest(message, errors) {
  const error = new Error(message);
  error.statusCode = 400;
  error.errors = errors || [];
  return error;
}

function sanitizeUser(user) {
  return {
    id: user._id,
    role: user.role,
    fullName: user.fullName,
    email: user.email,
    phone: user.phone,
    isActive: user.isActive,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt
  };
}

async function registerPatient(req, res, next) {
  try {
    const { fullName, email, phone, password } = req.body;

    if (!fullName || !email || !password) {
      throw badRequest('fullName, email and password are required');
    }

    const existing = await User.findOne({ email: String(email).toLowerCase() });
    if (existing) {
      throw badRequest('Email already registered');
    }

    const user = await User.create({
      role: 'patient',
      fullName: String(fullName).trim(),
      email: String(email).toLowerCase().trim(),
      phone: phone ? String(phone).trim() : undefined,
      passwordHash: await hashPassword(password)
    });

    await PatientProfile.create({
      userId: user._id,
      connectedDoctorIds: []
    });

    const refresh = await issueRefreshToken(user);

    res.status(201).json({
      success: true,
      message: 'Patient registered successfully',
      data: {
        user: sanitizeUser(user),
        accessToken: signAccessToken(user),
        refreshToken: refresh.token
      }
    });
  } catch (error) {
    next(error);
  }
}

async function registerDoctor(req, res, next) {
  try {
    const {
      fullName,
      email,
      phone,
      password,
      specialization,
      licenseNumber,
      qualifications,
      experienceYears,
      hospital,
      fee,
      bio,
      availability
    } = req.body;

    if (!fullName || !email || !password || !specialization || !licenseNumber) {
      throw badRequest(
        'fullName, email, password, specialization and licenseNumber are required'
      );
    }

    const normalizedEmail = String(email).toLowerCase().trim();
    const existing = await User.findOne({ email: normalizedEmail });
    if (existing) {
      throw badRequest('Email already registered');
    }

    const user = await User.create({
      role: 'doctor',
      fullName: String(fullName).trim(),
      email: normalizedEmail,
      phone: phone ? String(phone).trim() : undefined,
      passwordHash: await hashPassword(password)
    });

    await DoctorProfile.create({
      userId: user._id,
      specialization: String(specialization).trim(),
      licenseNumber: String(licenseNumber).trim(),
      qualifications: Array.isArray(qualifications) ? qualifications : [],
      experienceYears,
      hospital,
      fee,
      bio,
      availability,
      approvalStatus: 'pending'
    });

    const refresh = await issueRefreshToken(user);

    res.status(201).json({
      success: true,
      message: 'Doctor registered successfully. Approval is pending.',
      data: {
        user: sanitizeUser(user),
        accessToken: signAccessToken(user),
        refreshToken: refresh.token
      }
    });
  } catch (error) {
    next(error);
  }
}

async function login(req, res, next) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      throw badRequest('email and password are required');
    }

    const user = await User.findOne({ email: String(email).toLowerCase().trim() });
    if (!user) {
      throw badRequest('Invalid email or password');
    }

    const validPassword = await verifyPassword(user, password);
    if (!validPassword) {
      throw badRequest('Invalid email or password');
    }

    if (!user.isActive) {
      const error = new Error('Account is inactive');
      error.statusCode = 403;
      throw error;
    }

    const refresh = await issueRefreshToken(user);

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: sanitizeUser(user),
        accessToken: signAccessToken(user),
        refreshToken: refresh.token
      }
    });
  } catch (error) {
    next(error);
  }
}

async function adminLogin(req, res, next) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      throw badRequest('email and password are required');
    }

    const user = await User.findOne({ email: String(email).toLowerCase().trim() });
    if (!user || user.role !== 'admin') {
      throw badRequest('Invalid admin credentials');
    }

    const validPassword = await verifyPassword(user, password);
    if (!validPassword) {
      throw badRequest('Invalid admin credentials');
    }

    if (!user.isActive) {
      const error = new Error('Account is inactive');
      error.statusCode = 403;
      throw error;
    }

    const refresh = await issueRefreshToken(user);

    res.json({
      success: true,
      message: 'Admin login successful',
      data: {
        user: sanitizeUser(user),
        accessToken: signAccessToken(user),
        refreshToken: refresh.token
      }
    });
  } catch (error) {
    next(error);
  }
}

async function refresh(req, res, next) {
  try {
    const token = req.body.refreshToken;
    if (!token) {
      throw badRequest('refreshToken is required');
    }

    const payload = verifyRefreshToken(token);
    const user = await User.findById(payload.sub);

    if (!user || !user.isActive) {
      await revokeRefreshToken(token, { userId: payload.sub });
      const error = new Error('User not found or inactive');
      error.statusCode = 401;
      throw error;
    }

    const rotated = await rotateRefreshToken(token, user, payload);

    res.json({
      success: true,
      message: 'Token refreshed',
      data: {
        accessToken: signAccessToken(user),
        refreshToken: rotated.token
      }
    });
  } catch (error) {
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      error.statusCode = 401;
      error.message = 'Invalid or expired refresh token';
    }
    next(error);
  }
}

async function logout(req, res, next) {
  try {
    const refreshToken = req.body?.refreshToken;

    if (refreshToken) {
      await revokeRefreshToken(refreshToken);
    }

    res.json({
      success: true,
      message: 'Logout successful'
    });
  } catch (error) {
    next(error);
  }
}

async function me(req, res, next) {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      const error = new Error('User not found');
      error.statusCode = 404;
      throw error;
    }

    if (!user.isActive) {
      const error = new Error('Account is inactive');
      error.statusCode = 403;
      throw error;
    }

    res.json({
      success: true,
      data: {
        user: sanitizeUser(user)
      }
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  registerPatient,
  registerDoctor,
  login,
  adminLogin,
  refresh,
  logout,
  me
};
