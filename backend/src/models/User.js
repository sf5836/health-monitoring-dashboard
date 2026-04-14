const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
	{
		role: {
			type: String,
			enum: ['patient', 'doctor', 'admin'],
			required: true,
			default: 'patient'
		},
		fullName: {
			type: String,
			required: true,
			trim: true
		},
		email: {
			type: String,
			required: true,
			unique: true,
			lowercase: true,
			trim: true
		},
		phone: {
			type: String,
			trim: true
		},
		passwordHash: {
			type: String,
			required: true
		},
		isActive: {
			type: Boolean,
			default: true
		}
	},
	{ timestamps: true }
);

userSchema.index({ role: 1, isActive: 1 });

module.exports = mongoose.models.User || mongoose.model('User', userSchema);
