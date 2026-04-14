const { z, objectId } = require('./common');

const appointmentIdParamsSchema = z.object({
  appointmentId: objectId
});

const createAppointmentSchema = z.object({
  doctorId: objectId,
  type: z.enum(['in_person', 'teleconsult']).optional(),
  date: z.string().min(1),
  time: z.string().min(1),
  notes: z.string().optional()
});

const updatePatientAppointmentSchema = z
  .object({
    type: z.enum(['in_person', 'teleconsult']).optional(),
    date: z.string().min(1).optional(),
    time: z.string().min(1).optional(),
    notes: z.string().optional()
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
  appointmentIdParamsSchema,
  createAppointmentSchema,
  updatePatientAppointmentSchema,
  updateDoctorAppointmentSchema
};
