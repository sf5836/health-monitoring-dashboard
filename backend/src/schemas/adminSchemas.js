const { z, objectId } = require('./common');

const doctorIdParamsSchema = z.object({
  doctorId: objectId
});

const blogIdParamsSchema = z.object({
  blogId: objectId
});

const doctorDecisionSchema = z.object({
  note: z.string().max(500).optional()
});

const blogRejectSchema = z.object({
  reason: z.string().max(500).optional()
});

const adminCreateBlogSchema = z.object({
  title: z.string().min(3),
  excerpt: z.string().optional(),
  content: z.string().min(10),
  coverImageUrl: z.string().url().optional(),
  category: z.string().optional(),
  tags: z.array(z.string()).optional(),
  status: z.enum(['draft', 'pending_review', 'published', 'rejected', 'unpublished']).optional()
});

const adminUpdateBlogSchema = z
  .object({
    title: z.string().min(3).optional(),
    excerpt: z.string().optional(),
    content: z.string().min(10).optional(),
    coverImageUrl: z.string().url().optional(),
    category: z.string().optional(),
    tags: z.array(z.string()).optional(),
    status: z
      .enum(['draft', 'pending_review', 'published', 'rejected', 'unpublished'])
      .optional(),
    rejectionReason: z.string().optional()
  })
  .refine((payload) => Object.keys(payload).length > 0, {
    message: 'At least one field is required'
  });

module.exports = {
  doctorIdParamsSchema,
  blogIdParamsSchema,
  doctorDecisionSchema,
  blogRejectSchema,
  adminCreateBlogSchema,
  adminUpdateBlogSchema
};
