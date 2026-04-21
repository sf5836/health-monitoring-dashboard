const express = require('express');
const verifyToken = require('../middleware/verifyToken');
const checkRole = require('../middleware/checkRole');
const validate = require('../middleware/validate');
const chatController = require('../controllers/chatController');
const {
  createConversationSchema,
  conversationIdParamsSchema,
  sendMessageSchema
} = require('../schemas/chatSchemas');

const router = express.Router();

router.use(verifyToken, checkRole('patient', 'doctor', 'admin'));

router.get('/me/conversations', chatController.getMyConversations);
router.post(
  '/me/conversations',
  validate({ body: createConversationSchema }),
  chatController.createOrGetConversation
);
router.get(
  '/me/conversations/:conversationId/messages',
  validate({ params: conversationIdParamsSchema }),
  chatController.getConversationMessages
);
router.post(
  '/me/conversations/:conversationId/messages',
  validate({ params: conversationIdParamsSchema, body: sendMessageSchema }),
  chatController.sendMessage
);

module.exports = router;
