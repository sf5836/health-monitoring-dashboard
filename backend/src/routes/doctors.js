const express = require('express');
const verifyToken = require('../middleware/verifyToken');
const checkRole = require('../middleware/checkRole');
const requireDoctorApproved = require('../middleware/requireDoctorApproved');
const doctorController = require('../controllers/doctorController');
const appointmentController = require('../controllers/appointmentController');
const validate = require('../middleware/validate');
const {
	doctorIdParamsSchema,
	patientIdParamsSchema,
	appointmentIdParamsSchema,
	blogIdParamsSchema,
	createPrescriptionSchema,
	createDoctorBlogSchema,
	updateDoctorBlogSchema,
	addPatientNoteSchema,
	updateDoctorProfileSchema,
	updateDoctorAppointmentSchema
} = require('../schemas/doctorSchemas');
const { trendsQuerySchema } = require('../schemas/vitalSchemas');

const router = express.Router();

router.get('/', doctorController.getPublicDoctors);
router.get('/reviews/public', doctorController.getPublicTestimonials);
router.get(
	'/:doctorId/reviews/public',
	validate({ params: doctorIdParamsSchema }),
	doctorController.getPublicDoctorReviews
);
router.get(
	'/:doctorId/public',
	validate({ params: doctorIdParamsSchema }),
	doctorController.getPublicDoctorById
);

router.use(verifyToken, checkRole('doctor'));

router.get('/me/profile', doctorController.getMyProfile);
router.patch('/me/profile', validate({ body: updateDoctorProfileSchema }), doctorController.updateMyProfile);

router.use(requireDoctorApproved);

router.get('/me/dashboard', doctorController.getMyDashboard);
router.get('/me/patients', doctorController.getMyPatients);
router.get(
	'/me/patients/:patientId',
	validate({ params: patientIdParamsSchema }),
	doctorController.getMyPatientDetail
);
router.get(
	'/me/patients/:patientId/trends',
	validate({ params: patientIdParamsSchema, query: trendsQuerySchema }),
	doctorController.getMyPatientTrends
);
router.post(
	'/me/patients/:patientId/notes',
	validate({ params: patientIdParamsSchema, body: addPatientNoteSchema }),
	doctorController.addPatientNote
);

router.get('/me/appointments', appointmentController.getMyAppointmentsAsDoctor);
router.patch(
	'/me/appointments/:appointmentId',
	validate({ params: appointmentIdParamsSchema, body: updateDoctorAppointmentSchema }),
	appointmentController.updateMyAppointmentAsDoctor
);

router.get('/me/prescriptions', doctorController.getMyPrescriptions);
router.post(
	'/me/patients/:patientId/prescriptions',
	validate({ params: patientIdParamsSchema, body: createPrescriptionSchema }),
	doctorController.createPatientPrescription
);

router.get('/me/blogs', doctorController.getMyBlogs);
router.post('/me/blogs', validate({ body: createDoctorBlogSchema }), doctorController.createMyBlog);
router.patch(
	'/me/blogs/:blogId',
	validate({ params: blogIdParamsSchema, body: updateDoctorBlogSchema }),
	doctorController.updateMyBlog
);
router.post(
	'/me/blogs/:blogId/submit',
	validate({ params: blogIdParamsSchema }),
	doctorController.submitMyBlog
);

module.exports = router;
