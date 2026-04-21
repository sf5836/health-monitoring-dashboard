const { z, objectId } = require('./common');

const doctorIdParamsSchema = z.object({
  doctorId: objectId
});

const patientIdParamsSchema = z.object({
  patientId: objectId
});

const appointmentIdParamsSchema = z.object({
  appointmentId: objectId
});

const blogIdParamsSchema = z.object({
  blogId: objectId
});

const createPrescriptionSchema = z.object({
  diagnosis: z.string().optional(),
  medications: z
    .array(
      z.object({
        name: z.string().min(1),
        dosage: z.string().optional(),
        frequency: z.string().optional(),
        duration: z.string().optional()
      })
    )
    .min(1),
  instructions: z.string().optional(),
  followUpDate: z.string().datetime().optional(),
  pdfUrl: z.string().url().optional()
});

const createDoctorBlogSchema = z.object({
  title: z.string().min(3),
  excerpt: z.string().optional(),
  content: z.string().min(10),
  coverImageUrl: z.string().url().optional(),
  category: z.string().optional(),
  tags: z.array(z.string()).optional()
});

const updateDoctorBlogSchema = z
  .object({
    title: z.string().min(3).optional(),
    excerpt: z.string().optional(),
    content: z.string().min(10).optional(),
    coverImageUrl: z.string().url().optional(),
    category: z.string().optional(),
    tags: z.array(z.string()).optional()
  })
  .refine((payload) => Object.keys(payload).length > 0, {
    message: 'At least one field is required'
  });

const addPatientNoteSchema = z.object({
  note: z.string().min(3).max(1000)
});

const updateDoctorProfileSchema = z
  .object({
    fullName: z.string().min(2).optional(),
    phone: z.string().min(5).optional(),
    specialization: z.string().optional(),
    licenseNumber: z.string().min(2).optional(),
    qualifications: z.array(z.string()).optional(),
    experienceYears: z.number().int().nonnegative().optional(),
    hospital: z.string().optional(),
    fee: z.number().nonnegative().optional(),
    bio: z.string().optional(),
    availability: z.string().optional(),
    availabilitySchedule: z
      .array(
        z.object({
          day: z.enum(['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']),
          startTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/),
          endTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/)
        })
      )
      .optional(),
    legalDocuments: z
      .array(
        z.object({
          label: z.string().min(1).max(80).optional(),
          fileName: z.string().min(3),
          contentType: z
            .string()
            .refine((value) => String(value).toLowerCase().includes('pdf'), 'Document must be PDF format'),
          dataBase64: z.string().min(16)
        })
      )
      .optional()
  })
  .refine((payload) => Object.keys(payload).length > 0, {
    message: 'At least one field is required'
  });

const updateDoctorAppointmentSchema = z
  .object({
    status: z.enum(['pending', 'confirmed', 'completed', 'cancelled']).optional(),
    notes: z.string().optional(),
    date: z.string().min(1).optional(),
    time: z.string().min(1).optional(),
    type: z.enum(['in_person', 'teleconsult']).optional()
  })
  .refine((payload) => Object.keys(payload).length > 0, {
    message: 'At least one field is required'
  });

module.exports = {
  doctorIdParamsSchema,
  patientIdParamsSchema,
  appointmentIdParamsSchema,
  blogIdParamsSchema,
  createPrescriptionSchema,
  createDoctorBlogSchema,
  updateDoctorBlogSchema,
  addPatientNoteSchema,
  updateDoctorProfileSchema,
  updateDoctorAppointmentSchema
};
