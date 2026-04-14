const express = require('express');
const verifyToken = require('../middleware/verifyToken');
const checkRole = require('../middleware/checkRole');
const vitalController = require('../controllers/vitalController');
const validate = require('../middleware/validate');
const { vitalIdParamsSchema, trendsQuerySchema, vitalPayloadSchema } = require('../schemas/vitalSchemas');

const router = express.Router();

router.use(verifyToken, checkRole('patient'));

router.get('/me', vitalController.getMyVitals);
router.post('/me', validate({ body: vitalPayloadSchema }), vitalController.createMyVital);
router.patch('/me/:vitalId', validate({ params: vitalIdParamsSchema, body: vitalPayloadSchema }), vitalController.updateMyVital);
router.delete('/me/:vitalId', validate({ params: vitalIdParamsSchema }), vitalController.deleteMyVital);
router.get('/me/trends', validate({ query: trendsQuerySchema }), vitalController.getMyTrends);

module.exports = router;
