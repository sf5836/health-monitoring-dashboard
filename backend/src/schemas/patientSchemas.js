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
    profilePhoto: z
      .object({
        fileName: z.string().min(3),
        contentType: z
          .string()
          .refine(
            (value) =>
              ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'].includes(
                String(value).toLowerCase()
              ),
            'Profile photo must be an image'
          ),
        dataBase64: z.string().min(16)
      })
      .optional(),
    medicalDocuments: z
      .array(
        z.object({
          label: z.string().optional(),
          fileName: z.string().min(3),
          contentType: z
            .string()
            .refine(
              (value) =>
                ['application/pdf', 'image/png', 'image/jpeg', 'image/jpg'].includes(
                  String(value).toLowerCase()
                ),
              'Document must be a PDF or image'
            ),
          dataBase64: z.string().min(16)
        })
      )
      .optional(),
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
