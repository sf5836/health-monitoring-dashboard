const express = require('express');

const verifyToken = require('../middleware/verifyToken');
const checkRole = require('../middleware/checkRole');
const validate = require('../middleware/validate');
const prescriptionController = require('../controllers/prescriptionController');
const { prescriptionIdParamsSchema } = require('../schemas/prescriptionSchemas');

const router = express.Router();

router.use(verifyToken, checkRole('patient'));

router.get('/me', prescriptionController.getMyPrescriptions);
router.get(
  '/me/:prescriptionId/pdf',
  validate({ params: prescriptionIdParamsSchema }),
  prescriptionController.getPrescriptionPdf
);

module.exports = router;
