const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema(
	{
		conversationId: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'Conversation',
			required: true
		},
		senderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
		messageType: {
			type: String,
			enum: ['text', 'file', 'prescription'],
			default: 'text'
		},
		text: { type: String, trim: true },
		fileUrl: { type: String, trim: true },
		readBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]
	},
	{ timestamps: true }
);

messageSchema.index({ conversationId: 1, createdAt: 1 });

module.exports = mongoose.models.Message || mongoose.model('Message', messageSchema);
