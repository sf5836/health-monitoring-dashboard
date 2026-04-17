const { z } = require('./common');

const password = z.string().min(8, 'Password must be at least 8 characters');
const email = z.string().email('Invalid email').transform((value) => value.toLowerCase());

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
  specialization: z.string().min(2),
  licenseNumber: z.string().min(2),
  qualifications: z.array(z.string()).optional(),
  experienceYears: z.number().int().nonnegative().optional(),
  hospital: z.string().optional(),
  fee: z.number().nonnegative().optional(),
  bio: z.string().optional(),
  availability: z.string().optional()
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
