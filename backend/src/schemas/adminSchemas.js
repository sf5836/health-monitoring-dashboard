const { z, objectId } = require('./common');

const doctorIdParamsSchema = z.object({
  doctorId: objectId
});

const patientIdParamsSchema = z.object({
  patientId: objectId
});

const blogIdParamsSchema = z.object({
  blogId: objectId
});

const availabilitySlotSchema = z.object({
  day: z.enum(['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']),
  startTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/),
  endTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/)
});

const legalDocumentMetaSchema = z.object({
  label: z.string().optional(),
  fileName: z.string().min(3),
  fileUrl: z.string().url(),
  contentType: z.string().optional()
});

const doctorDecisionSchema = z.object({
  note: z.string().max(500).optional()
});

const adminUpdateDoctorSchema = z
  .object({
    fullName: z.string().min(2).optional(),
    email: z.string().email().optional(),
    phone: z.string().min(5).optional(),
    specialization: z.string().min(2).optional(),
    licenseNumber: z.string().min(2).optional(),
    qualifications: z.array(z.string()).optional(),
    experienceYears: z.number().int().nonnegative().optional(),
    hospital: z.string().optional(),
    fee: z.number().nonnegative().optional(),
    bio: z.string().optional(),
    availability: z.string().optional(),
    availabilitySchedule: z.array(availabilitySlotSchema).optional(),
    legalDocuments: z.array(legalDocumentMetaSchema).optional(),
    approvalStatus: z.enum(['pending', 'approved', 'rejected', 'suspended']).optional(),
    isActive: z.boolean().optional()
  })
  .refine((payload) => Object.keys(payload).length > 0, {
    message: 'At least one field is required'
  });

const adminUpdatePatientSchema = z
  .object({
    fullName: z.string().min(2).optional(),
    email: z.string().email().optional(),
    phone: z.string().min(5).optional(),
    dob: z.string().datetime().optional(),
    gender: z.string().optional(),
    bloodGroup: z.string().optional(),
    heightCm: z.number().nonnegative().optional(),
    weightKg: z.number().nonnegative().optional(),
    allergies: z.array(z.string()).optional(),
    medications: z.array(z.string()).optional(),
    medicalHistory: z.string().optional(),
    emergencyContact: z
      .object({
        name: z.string().optional(),
        relationship: z.string().optional(),
        phone: z.string().optional()
      })
      .optional(),
    isActive: z.boolean().optional()
  })
  .refine((payload) => Object.keys(payload).length > 0, {
    message: 'At least one field is required'
  });

const blogRejectSchema = z.object({
  reason: z.string().max(500).optional()
});

const adminCreateBlogSchema = z.object({
  title: z.string().min(3),
  excerpt: z.string().optional(),
  content: z.string().min(10),
  coverImageUrl: z.string().url().optional(),
  category: z.string().optional(),
  tags: z.array(z.string()).optional(),
  status: z.enum(['draft', 'pending_review', 'published', 'rejected', 'unpublished']).optional()
});

const adminUpdateBlogSchema = z
  .object({
    title: z.string().min(3).optional(),
    excerpt: z.string().optional(),
    content: z.string().min(10).optional(),
    coverImageUrl: z.string().url().optional(),
    category: z.string().optional(),
    tags: z.array(z.string()).optional(),
    status: z
      .enum(['draft', 'pending_review', 'published', 'rejected', 'unpublished'])
      .optional(),
    rejectionReason: z.string().optional()
  })
  .refine((payload) => Object.keys(payload).length > 0, {
    message: 'At least one field is required'
  });

module.exports = {
  doctorIdParamsSchema,
  patientIdParamsSchema,
  blogIdParamsSchema,
  doctorDecisionSchema,
  adminUpdateDoctorSchema,
  adminUpdatePatientSchema,
  blogRejectSchema,
  adminCreateBlogSchema,
  adminUpdateBlogSchema
};
