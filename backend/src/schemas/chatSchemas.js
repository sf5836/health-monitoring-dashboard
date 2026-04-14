const { z, objectId } = require('./common');

const conversationIdParamsSchema = z.object({
  conversationId: objectId
});

const sendMessageSchema = z
  .object({
    text: z.string().min(1).optional(),
    fileUrl: z.string().url().optional(),
    messageType: z.enum(['text', 'file', 'prescription']).optional()
  })
  .refine((payload) => Boolean(payload.text || payload.fileUrl), {
    message: 'Either text or fileUrl is required'
  });

module.exports = {
  conversationIdParamsSchema,
  sendMessageSchema
};
