const express = require('express');
const verifyToken = require('../middleware/verifyToken');
const checkRole = require('../middleware/checkRole');
const patientController = require('../controllers/patientController');
const validate = require('../middleware/validate');
const { doctorIdParamsSchema, updatePatientProfileSchema } = require('../schemas/patientSchemas');

const router = express.Router();

router.use(verifyToken, checkRole('patient'));

router.get('/me/dashboard', patientController.getMyDashboard);
router.get('/me/profile', patientController.getMyProfile);
router.patch('/me/profile', validate({ body: updatePatientProfileSchema }), patientController.updateMyProfile);
router.get('/me/doctors', patientController.getMyDoctors);
router.post(
	'/me/doctors/:doctorId/connect',
	validate({ params: doctorIdParamsSchema }),
	patientController.connectDoctor
);
router.delete(
	'/me/doctors/:doctorId/disconnect',
	validate({ params: doctorIdParamsSchema }),
	patientController.disconnectDoctor
);
router.get('/me/appointments', patientController.getMyAppointments);
router.get('/me/prescriptions', patientController.getMyPrescriptions);

module.exports = router;
