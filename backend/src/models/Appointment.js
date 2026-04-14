const mongoose = require('mongoose');

const appointmentSchema = new mongoose.Schema(
	{
		patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
		doctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
		type: {
			type: String,
			enum: ['in_person', 'teleconsult'],
			default: 'in_person'
		},
		date: { type: String, required: true },
		time: { type: String, required: true },
		status: {
			type: String,
			enum: ['pending', 'confirmed', 'completed', 'cancelled'],
			default: 'pending'
		},
		notes: { type: String, trim: true },
		createdBy: {
			type: String,
			enum: ['patient', 'doctor', 'admin'],
			default: 'patient'
		}
	},
	{ timestamps: true }
);

appointmentSchema.index({ patientId: 1, date: 1 });
appointmentSchema.index({ doctorId: 1, date: 1 });
appointmentSchema.index({ status: 1 });

module.exports =
	mongoose.models.Appointment || mongoose.model('Appointment', appointmentSchema);
