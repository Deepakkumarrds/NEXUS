const express = require('express');
const router = express.Router();
const leaveController = require('../controllers/leaveController');

router.get('/', leaveController.getAllLeaves);
router.post('/', leaveController.requestLeave);
router.patch('/:id/status', leaveController.updateLeaveStatus);

module.exports = router;
