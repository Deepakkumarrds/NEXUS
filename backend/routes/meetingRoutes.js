const express = require('express');
const router = express.Router();
const meetingController = require('../controllers/meetingController');

// Routes
router.post('/', meetingController.createMeeting);
router.get('/', meetingController.getAllMeetings);

module.exports = router;
