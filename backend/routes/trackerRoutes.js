const express = require('express');
const router = express.Router();
const trackerController = require('../controllers/trackerController');
const { protect } = require('../middleware/authMiddleware');

// Get tracker data matrix
router.get('/', protect, trackerController.getTrackerData);

// Update or create a tracker cell
router.post('/cell', protect, trackerController.updateTrackerCell);

// Get client activity (tasks + summaries)
router.get('/activity', trackerController.getClientActivity);

module.exports = router;
