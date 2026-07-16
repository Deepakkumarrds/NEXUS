const express = require('express');
const router = express.Router();
const leaveController = require('../controllers/leaveController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.post('/apply', leaveController.applyLeave);
router.get('/my-leaves', leaveController.getMyLeaves);
router.get('/pending', leaveController.getPendingLeaves);
router.get('/report', leaveController.getAttendanceReport);
router.get('/calendar', leaveController.getCalendar);
router.post('/:id/approve', leaveController.approveLeave);
router.post('/:id/reject', leaveController.rejectLeave);

module.exports = router;
