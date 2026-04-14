const mongoose = require('mongoose');

const blogSchema = new mongoose.Schema(
	{
		authorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
		authorRole: { type: String, enum: ['doctor', 'admin'], required: true },
		title: { type: String, required: true, trim: true },
		excerpt: { type: String, trim: true },
		content: { type: String, required: true },
		coverImageUrl: { type: String, trim: true },
		category: { type: String, trim: true },
		tags: [{ type: String, trim: true }],
		status: {
			type: String,
			enum: ['draft', 'pending_review', 'published', 'rejected', 'unpublished'],
			default: 'draft'
		},
		rejectionReason: { type: String, trim: true },
		submittedAt: { type: Date },
		publishedAt: { type: Date },
		views: { type: Number, default: 0 },
		likes: { type: Number, default: 0 }
	},
	{ timestamps: true }
);

blogSchema.index({ status: 1, submittedAt: 1 });
blogSchema.index({ status: 1, publishedAt: 1 });
blogSchema.index({ category: 1 });
blogSchema.index({ tags: 1 });

module.exports = mongoose.models.Blog || mongoose.model('Blog', blogSchema);
