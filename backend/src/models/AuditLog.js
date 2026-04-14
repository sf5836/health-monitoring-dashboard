const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema(
	{
		actorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
		actorRole: { type: String, enum: ['patient', 'doctor', 'admin'] },
		action: { type: String, required: true, trim: true },
		entityType: { type: String, required: true, trim: true },
		entityId: { type: mongoose.Schema.Types.ObjectId },
		details: { type: mongoose.Schema.Types.Mixed }
	},
	{ timestamps: true }
);

auditLogSchema.index({ actorId: 1, createdAt: -1 });
auditLogSchema.index({ entityType: 1, entityId: 1 });

module.exports = mongoose.models.AuditLog || mongoose.model('AuditLog', auditLogSchema);
