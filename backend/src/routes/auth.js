const express = require('express');
const authController = require('../controllers/authController');
const verifyToken = require('../middleware/verifyToken');
const validate = require('../middleware/validate');
const { authGeneralLimiter, authLoginLimiter } = require('../middleware/rateLimiter');
const {
	registerPatientSchema,
	registerDoctorSchema,
	loginSchema,
	refreshSchema,
	logoutSchema
} = require('../schemas/authSchemas');

const router = express.Router();

router.post(
	'/register/patient',
	authGeneralLimiter,
	validate({ body: registerPatientSchema }),
	authController.registerPatient
);
router.post(
	'/register/doctor',
	authGeneralLimiter,
	validate({ body: registerDoctorSchema }),
	authController.registerDoctor
);
router.post('/login', authLoginLimiter, validate({ body: loginSchema }), authController.login);
router.post(
	'/admin/login',
	authLoginLimiter,
	validate({ body: loginSchema }),
	authController.adminLogin
);
router.post(
	'/admin-login',
	authLoginLimiter,
	validate({ body: loginSchema }),
	authController.adminLogin
);
router.post('/refresh', authGeneralLimiter, validate({ body: refreshSchema }), authController.refresh);
router.post('/logout', authGeneralLimiter, validate({ body: logoutSchema }), authController.logout);
router.get('/me', verifyToken, authController.me);

module.exports = router;
