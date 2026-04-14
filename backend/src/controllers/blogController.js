const mongoose = require('mongoose');

const Blog = require('../models/Blog');

async function getPublicBlogs(req, res, next) {
  try {
    const limit = Math.min(Math.max(Number(req.query.limit || 20), 1), 100);
    const category = req.query.category ? String(req.query.category).trim() : null;

    const filter = { status: 'published' };
    if (category) {
      filter.category = category;
    }

    const blogs = await Blog.find(filter)
      .sort({ publishedAt: -1, createdAt: -1 })
      .limit(limit)
      .populate('authorId', 'fullName')
      .lean();

    res.json({
      success: true,
      data: { blogs }
    });
  } catch (error) {
    next(error);
  }
}

async function getPublicBlogById(req, res, next) {
  try {
    const { blogId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(blogId)) {
      const error = new Error('Invalid blogId');
      error.statusCode = 400;
      throw error;
    }

    const blog = await Blog.findOne({ _id: blogId, status: 'published' })
      .populate('authorId', 'fullName')
      .lean();

    if (!blog) {
      const error = new Error('Blog not found');
      error.statusCode = 404;
      throw error;
    }

    await Blog.updateOne({ _id: blogId }, { $inc: { views: 1 } });

    res.json({
      success: true,
      data: { blog: { ...blog, views: (blog.views || 0) + 1 } }
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getPublicBlogs,
  getPublicBlogById
};
