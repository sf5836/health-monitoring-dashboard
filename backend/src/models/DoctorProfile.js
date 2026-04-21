const mongoose = require('mongoose');

const availabilitySlotSchema = new mongoose.Schema(
	{
		day: {
			type: String,
			enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
			required: true
		},
		startTime: { type: String, required: true, trim: true },
		endTime: { type: String, required: true, trim: true }
	},
	{ _id: false }
);

const legalDocumentSchema = new mongoose.Schema(
	{
		label: { type: String, trim: true },
		fileName: { type: String, required: true, trim: true },
		fileUrl: { type: String, required: true, trim: true },
		contentType: { type: String, default: 'application/pdf', trim: true },
		uploadedAt: { type: Date, default: Date.now }
	},
	{ _id: false }
);

const doctorProfileSchema = new mongoose.Schema(
	{
		userId: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'User',
			required: true,
			unique: true
		},
		specialization: { type: String, trim: true },
		licenseNumber: {
			type: String,
			trim: true,
			unique: true,
			sparse: true
		},
		qualifications: [{ type: String, trim: true }],
		experienceYears: { type: Number },
		hospital: { type: String, trim: true },
		fee: { type: Number },
		rating: { type: Number, min: 0, max: 5, default: 5 },
		reviewsCount: { type: Number, min: 0, default: 0 },
		bio: { type: String, trim: true },
		availability: { type: String, trim: true },
		availabilitySchedule: [availabilitySlotSchema],
		legalDocuments: [legalDocumentSchema],
		approvalStatus: {
			type: String,
			enum: ['pending', 'approved', 'rejected', 'suspended'],
			default: 'pending'
		},
		approvalNote: { type: String, trim: true },
		approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
		approvedAt: { type: Date }
	},
	{ timestamps: true }
);

doctorProfileSchema.index({ approvalStatus: 1 });
doctorProfileSchema.index({ specialization: 1 });
doctorProfileSchema.index({ rating: -1, reviewsCount: -1 });

module.exports =
	mongoose.models.DoctorProfile ||
	mongoose.model('DoctorProfile', doctorProfileSchema);
