const { z, objectId } = require('./common');

const notificationIdParamsSchema = z.object({
  notificationId: objectId
});

const listNotificationsQuerySchema = z.object({
  since: z.string().datetime().optional(),
  limit: z.coerce.number().int().min(1).max(100).optional()
});

module.exports = {
  notificationIdParamsSchema,
  listNotificationsQuerySchema
};
