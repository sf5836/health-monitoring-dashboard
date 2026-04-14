const { z, objectId } = require('./common');

const vitalIdParamsSchema = z.object({
  vitalId: objectId
});

const trendsQuerySchema = z.object({
  days: z.coerce.number().int().min(1).max(365).optional()
});

const vitalPayloadSchema = z
  .object({
    datetime: z.string().datetime().optional(),
    bloodPressure: z
      .object({
        systolic: z.number().int().positive().optional(),
        diastolic: z.number().int().positive().optional()
      })
      .optional(),
    heartRate: z.number().int().positive().optional(),
    spo2: z.number().int().min(1).max(100).optional(),
    temperatureC: z.number().min(30).max(45).optional(),
    glucose: z
      .object({
        value: z.number().positive().optional(),
        mode: z.enum(['fasting', 'post_meal', 'random']).optional()
      })
      .optional(),
    weightKg: z.number().positive().optional(),
    notes: z.string().optional()
  })
  .refine((payload) => Object.keys(payload).length > 0, {
    message: 'At least one vital field is required'
  });

module.exports = {
  vitalIdParamsSchema,
  trendsQuerySchema,
  vitalPayloadSchema
};
