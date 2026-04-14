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

module.exports =
	mongoose.models.DoctorProfile ||
	mongoose.model('DoctorProfile', doctorProfileSchema);
