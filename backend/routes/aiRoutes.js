const express = require('express');
const router = express.Router();
const aiController = require('../controllers/aiController');

// Ensure you have authMiddleware if you want to protect this route
// const authMiddleware = require('../middleware/authMiddleware');

router.post('/calendar', aiController.generateCalendar);

module.exports = router;
