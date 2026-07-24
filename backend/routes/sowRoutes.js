const express = require('express');
const router = express.Router();
const sowController = require('../controllers/sowController');

// Routes
router.post('/', sowController.createSow);
router.get('/', sowController.getAllSows);
router.get('/:id', sowController.getSowById);
router.put('/:id', sowController.updateSow);
router.delete('/:id', sowController.deleteSow);
router.patch('/items/:id/status', sowController.updateSowItemStatus);
router.post('/:id/items', sowController.addSowItem);
router.patch('/month/:id/submit', sowController.submitSowMonthForApproval);
router.patch('/month/:id/approve', sowController.approveSowMonth);
router.patch('/month/:id/reject', sowController.rejectSowMonth);

module.exports = router;
