const mongoose = require('mongoose');

const vitalRecordSchema = new mongoose.Schema(
	{
		patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
		datetime: { type: Date, required: true, default: Date.now },
		bloodPressure: {
			systolic: { type: Number },
			diastolic: { type: Number }
		},
		heartRate: { type: Number },
		spo2: { type: Number },
		temperatureC: { type: Number },
		glucose: {
			value: { type: Number },
			mode: { type: String, enum: ['fasting', 'post_meal', 'random'] }
		},
		weightKg: { type: Number },
		notes: { type: String, trim: true },
		riskLevel: {
			type: String,
			enum: ['normal', 'medium', 'high'],
			default: 'normal'
		},
		riskReasons: [{ type: String, trim: true }]
	},
	{ timestamps: true }
);

vitalRecordSchema.index({ patientId: 1, datetime: -1 });
vitalRecordSchema.index({ patientId: 1, riskLevel: 1 });

module.exports =
	mongoose.models.VitalRecord || mongoose.model('VitalRecord', vitalRecordSchema);
