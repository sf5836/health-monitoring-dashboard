const express = require('express');

const verifyToken = require('../middleware/verifyToken');
const checkRole = require('../middleware/checkRole');
const validate = require('../middleware/validate');
const appointmentController = require('../controllers/appointmentController');
const {
  appointmentIdParamsSchema,
  createAppointmentSchema,
  updatePatientAppointmentSchema
} = require('../schemas/appointmentSchemas');

const router = express.Router();

router.use(verifyToken, checkRole('patient'));

router.get('/me', appointmentController.getMyAppointmentsAsPatient);
router.post('/me', validate({ body: createAppointmentSchema }), appointmentController.createMyAppointment);
router.patch(
  '/me/:appointmentId',
  validate({ params: appointmentIdParamsSchema, body: updatePatientAppointmentSchema }),
  appointmentController.updateMyAppointment
);
router.delete(
  '/me/:appointmentId',
  validate({ params: appointmentIdParamsSchema }),
  appointmentController.cancelMyAppointment
);

module.exports = router;
