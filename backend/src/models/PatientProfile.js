const mongoose = require('mongoose');

const emergencyContactSchema = new mongoose.Schema(
	{
		name: { type: String, trim: true },
		relationship: { type: String, trim: true },
		phone: { type: String, trim: true }
	},
	{ _id: false }
);

const doctorNoteSchema = new mongoose.Schema(
	{
		doctorId: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'User',
			required: true
		},
		note: { type: String, required: true, trim: true },
		createdAt: { type: Date, default: Date.now },
		updatedAt: { type: Date, default: Date.now }
	},
	{ _id: true }
);

const medicalDocumentSchema = new mongoose.Schema(
	{
		label: { type: String, trim: true },
		fileName: { type: String, trim: true },
		fileUrl: { type: String, trim: true },
		contentType: { type: String, trim: true },
		uploadedAt: { type: Date, default: Date.now }
	},
	{ _id: true }
);

const profilePhotoSchema = new mongoose.Schema(
	{
		fileName: { type: String, trim: true },
		fileUrl: { type: String, trim: true },
		contentType: { type: String, trim: true },
		uploadedAt: { type: Date, default: Date.now }
	},
	{ _id: false }
);

const riskOverrideSchema = new mongoose.Schema(
	{
		level: {
			type: String,
			enum: ['normal', 'medium', 'high'],
			required: true
		},
		note: { type: String, trim: true },
		updatedAt: { type: Date, default: Date.now },
		updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
	},
	{ _id: false }
);

const patientProfileSchema = new mongoose.Schema(
	{
		userId: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'User',
			required: true,
			unique: true
		},
		dob: { type: Date },
		gender: { type: String, trim: true },
		bloodGroup: { type: String, trim: true },
		heightCm: { type: Number },
		weightKg: { type: Number },
		allergies: [{ type: String, trim: true }],
		medications: [{ type: String, trim: true }],
		medicalHistory: { type: String, trim: true },
		profilePhoto: profilePhotoSchema,
		riskOverride: riskOverrideSchema,
		medicalDocuments: [medicalDocumentSchema],
		emergencyContact: emergencyContactSchema,
		connectedDoctorIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
		doctorNotes: [doctorNoteSchema]
	},
	{ timestamps: true }
);

patientProfileSchema.index({ connectedDoctorIds: 1 });

module.exports =
	mongoose.models.PatientProfile ||
	mongoose.model('PatientProfile', patientProfileSchema);
