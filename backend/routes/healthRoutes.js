const express = require('express');
const router = express.Router();
const healthController = require('../controllers/healthController');
const { protect } = require('../middleware/authMiddleware');

// Get all latest health scores
router.get('/', protect, healthController.getHealthScores);

// Create a new health score
router.post('/', protect, healthController.createHealthScore);

// Get history for a specific client
router.get('/:clientId/history', protect, healthController.getClientHealthHistory);

module.exports = router;
