const express = require('express');
const blogController = require('../controllers/blogController');

const router = express.Router();

router.post('/subscribe', blogController.subscribeToNewsletter);
router.get('/public', blogController.getPublicBlogs);
router.get('/public/:blogId', blogController.getPublicBlogById);

module.exports = router;
