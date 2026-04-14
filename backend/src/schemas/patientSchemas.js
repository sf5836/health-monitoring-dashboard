const { z, objectId } = require('./common');

const doctorIdParamsSchema = z.object({
  doctorId: objectId
});

const updatePatientProfileSchema = z
  .object({
    dob: z.string().datetime().optional(),
    gender: z.string().optional(),
    bloodGroup: z.string().optional(),
    heightCm: z.number().positive().optional(),
    weightKg: z.number().positive().optional(),
    allergies: z.array(z.string()).optional(),
    medications: z.array(z.string()).optional(),
    medicalHistory: z.string().optional(),
    emergencyContact: z
      .object({
        name: z.string().optional(),
        relationship: z.string().optional(),
        phone: z.string().optional()
      })
      .optional()
  })
  .refine((payload) => Object.keys(payload).length > 0, {
    message: 'At least one field is required'
  });

module.exports = {
  doctorIdParamsSchema,
  updatePatientProfileSchema
};
