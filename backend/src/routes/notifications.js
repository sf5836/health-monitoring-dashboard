const express = require('express');
const verifyToken = require('../middleware/verifyToken');
const checkRole = require('../middleware/checkRole');
const validate = require('../middleware/validate');
const notificationController = require('../controllers/notificationController');
const {
  notificationIdParamsSchema,
  listNotificationsQuerySchema
} = require('../schemas/notificationSchemas');

const router = express.Router();

router.use(verifyToken, checkRole('patient', 'doctor', 'admin'));

router.get('/me', validate({ query: listNotificationsQuerySchema }), notificationController.getMyNotifications);
router.get('/me/unread-count', notificationController.getMyUnreadCount);
router.patch(
  '/me/:notificationId/read',
  validate({ params: notificationIdParamsSchema }),
  notificationController.markMyNotificationRead
);
router.patch('/me/read-all', notificationController.markAllMyNotificationsRead);

module.exports = router;
