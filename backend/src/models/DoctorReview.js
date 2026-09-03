const mongoose = require('mongoose');

const doctorReviewSchema = new mongoose.Schema(
  {
    doctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    rating: { type: Number, min: 1, max: 5, required: true },
    comment: { type: String, required: true, trim: true, maxlength: 1000 }
  },
  { timestamps: true }
);

doctorReviewSchema.index({ doctorId: 1, createdAt: -1 });
doctorReviewSchema.index({ doctorId: 1, patientId: 1 }, { unique: true });

module.exports = mongoose.models.DoctorReview || mongoose.model('DoctorReview', doctorReviewSchema);
