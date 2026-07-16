const express = require('express');
const router = express.Router();
const attendanceController = require('../controllers/attendanceTrackerController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.post('/punch-in', attendanceController.punchIn);
router.post('/punch-out', attendanceController.punchOut);
router.post('/status', attendanceController.updateStatus);
router.get('/my-status', attendanceController.getMyStatus);
router.get('/team-status', attendanceController.getTeamStatus);
router.get('/history', attendanceController.getHistory);

module.exports = router;
