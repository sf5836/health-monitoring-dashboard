const mongoose = require('mongoose');

const medicationSchema = new mongoose.Schema(
	{
		name: { type: String, required: true, trim: true },
		dosage: { type: String, trim: true },
		frequency: { type: String, trim: true },
		duration: { type: String, trim: true }
	},
	{ _id: false }
);

const prescriptionSchema = new mongoose.Schema(
	{
		patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
		doctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
		diagnosis: { type: String, trim: true },
		medications: [medicationSchema],
		instructions: { type: String, trim: true },
		followUpDate: { type: Date },
		issuedAt: { type: Date, default: Date.now },
		pdfUrl: { type: String, trim: true }
	},
	{ timestamps: true }
);

prescriptionSchema.index({ patientId: 1, issuedAt: -1 });
prescriptionSchema.index({ doctorId: 1, issuedAt: -1 });

module.exports =
	mongoose.models.Prescription || mongoose.model('Prescription', prescriptionSchema);
