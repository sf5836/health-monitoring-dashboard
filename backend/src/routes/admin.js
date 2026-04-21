const express = require('express');
const verifyToken = require('../middleware/verifyToken');
const checkRole = require('../middleware/checkRole');
const adminController = require('../controllers/adminController');
const validate = require('../middleware/validate');
const { adminActionLimiter } = require('../middleware/rateLimiter');
const {
	doctorIdParamsSchema,
	patientIdParamsSchema,
	blogIdParamsSchema,
	doctorDecisionSchema,
	adminUpdateDoctorSchema,
	adminUpdatePatientSchema,
	blogRejectSchema,
	adminCreateBlogSchema,
	adminUpdateBlogSchema
} = require('../schemas/adminSchemas');

const router = express.Router();

router.use(verifyToken, checkRole('admin'));
router.use(adminActionLimiter);

router.get('/dashboard', adminController.getDashboard);

router.get('/doctors', adminController.getDoctors);
router.patch(
	'/doctors/:doctorId',
	validate({ params: doctorIdParamsSchema, body: adminUpdateDoctorSchema }),
	adminController.updateDoctor
);
router.delete(
	'/doctors/:doctorId',
	validate({ params: doctorIdParamsSchema }),
	adminController.deleteDoctor
);
router.get('/doctors/pending', adminController.getPendingDoctors);
router.post(
	'/doctors/:doctorId/approve',
	validate({ params: doctorIdParamsSchema, body: doctorDecisionSchema }),
	adminController.approveDoctor
);
router.post(
	'/doctors/:doctorId/reject',
	validate({ params: doctorIdParamsSchema, body: doctorDecisionSchema }),
	adminController.rejectDoctor
);
router.post(
	'/doctors/:doctorId/suspend',
	validate({ params: doctorIdParamsSchema, body: doctorDecisionSchema }),
	adminController.suspendDoctor
);
router.get('/patients', adminController.getPatients);
router.patch(
	'/patients/:patientId',
	validate({ params: patientIdParamsSchema, body: adminUpdatePatientSchema }),
	adminController.updatePatient
);
router.delete(
	'/patients/:patientId',
	validate({ params: patientIdParamsSchema }),
	adminController.deletePatient
);
router.get('/appointments', adminController.getAppointments);
router.get('/activity/recent', adminController.getRecentActivity);

router.get('/blogs', adminController.getBlogs);
router.get('/blogs/pending', adminController.getPendingBlogs);
router.delete(
	'/blogs/:blogId',
	validate({ params: blogIdParamsSchema }),
	adminController.deleteBlog
);
router.post(
	'/blogs/:blogId/publish',
	validate({ params: blogIdParamsSchema }),
	adminController.publishBlog
);
router.post(
	'/blogs/:blogId/reject',
	validate({ params: blogIdParamsSchema, body: blogRejectSchema }),
	adminController.rejectBlog
);
router.post('/blogs', validate({ body: adminCreateBlogSchema }), adminController.createBlog);
router.patch(
	'/blogs/:blogId',
	validate({ params: blogIdParamsSchema, body: adminUpdateBlogSchema }),
	adminController.updateBlog
);

router.get('/analytics/overview', adminController.getAnalyticsOverview);
router.get('/analytics/growth', adminController.getAnalyticsGrowth);
router.get('/analytics/blogs', adminController.getAnalyticsBlogs);
router.get('/analytics/performance', adminController.getAnalyticsPerformance);

module.exports = router;
