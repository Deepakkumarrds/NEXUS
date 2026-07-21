const express = require('express');
const router = express.Router();
const socialController = require('../controllers/socialController');

// POST /api/social/instagram/post
router.post('/instagram/post', socialController.postToInstagram);

module.exports = router;
