const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
	{
		userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
		type: { type: String, trim: true, required: true },
		title: { type: String, trim: true, required: true },
		body: { type: String, trim: true },
		isRead: { type: Boolean, default: false },
		metadata: { type: mongoose.Schema.Types.Mixed }
	},
	{ timestamps: true }
);

notificationSchema.index({ userId: 1, isRead: 1 });
notificationSchema.index({ userId: 1, createdAt: -1 });

module.exports =
	mongoose.models.Notification || mongoose.model('Notification', notificationSchema);
