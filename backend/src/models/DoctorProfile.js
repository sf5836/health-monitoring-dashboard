const mongoose = require('mongoose');

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
