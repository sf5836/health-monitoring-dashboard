const { z } = require('./common');

const password = z.string().min(8, 'Password must be at least 8 characters');
const email = z.string().email('Invalid email').transform((value) => value.toLowerCase());

const availabilitySlotSchema = z.object({
  day: z.enum(['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']),
  startTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/),
  endTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/)
});

const legalDocumentSchema = z.object({
  label: z.string().min(1).max(80).optional(),
  fileName: z.string().min(3),
  contentType: z
    .string()
    .refine((value) => String(value).toLowerCase().includes('pdf'), 'Document must be PDF format'),
  dataBase64: z.string().min(16)
});

const registerPatientSchema = z.object({
  fullName: z.string().min(2),
  email,
  phone: z.string().min(5).optional(),
  password
});

const registerDoctorSchema = z.object({
  fullName: z.string().min(2),
  email,
  phone: z.string().min(5).optional(),
  password,
  specialization: z.string().min(2).optional(),
  licenseNumber: z.string().min(2).optional(),
  qualifications: z.array(z.string()).optional(),
  experienceYears: z.number().int().nonnegative().optional(),
  hospital: z.string().optional(),
  fee: z.number().nonnegative().optional(),
  bio: z.string().optional(),
  availability: z.string().optional(),
  availabilitySchedule: z.array(availabilitySlotSchema).optional(),
  legalDocuments: z.array(legalDocumentSchema).optional()
});

const loginSchema = z.object({
  email,
  password: z.string().min(1)
});

const refreshSchema = z.object({
  refreshToken: z.string().min(1)
});

const logoutSchema = z.object({
  refreshToken: z.string().min(1).optional()
});

module.exports = {
  registerPatientSchema,
  registerDoctorSchema,
  loginSchema,
  refreshSchema,
  logoutSchema
};
