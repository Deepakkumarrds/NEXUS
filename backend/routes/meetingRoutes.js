const express = require('express');
const router = express.Router();
const meetingController = require('../controllers/meetingController');

// AI Extraction & Auto Task Routes
router.post('/extract-mom', meetingController.extractMomFromText);
router.post('/save-with-tasks', meetingController.createMeetingWithTasks);

// Routes
router.post('/', meetingController.createMeeting);
router.get('/', meetingController.getAllMeetings);
router.get('/:id', meetingController.getMeetingById);
router.put('/:id', meetingController.updateMeeting);
router.delete('/:id', meetingController.deleteMeeting);

// Update Action Item Status
router.patch('/action-items/:id/status', meetingController.updateActionItemStatus);

module.exports = router;
