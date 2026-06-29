const express = require('express');
const router = express.Router();
const workRequestController = require('../controllers/workRequestController');
const { protect } = require('../middleware/authMiddleware');

// Get all & create new
router.route('/')
  .get(protect, workRequestController.getWorkRequests)
  .post(protect, workRequestController.createWorkRequest);

// Accept a work request (assignee action)
router.route('/:id/accept')
  .put(protect, workRequestController.acceptWorkRequest);

// Update just the status
router.route('/:id/status')
  .put(protect, workRequestController.updateWorkRequestStatus);

// Get, update, delete specific work request
router.route('/:id')
  .get(protect, workRequestController.getWorkRequestById)
  .put(protect, workRequestController.updateWorkRequest)
  .delete(protect, workRequestController.deleteWorkRequest);

module.exports = router;
