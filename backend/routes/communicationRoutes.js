const express = require('express');
const router = express.Router();
const communicationController = require('../controllers/communicationController');

// Routes
router.post('/', communicationController.createLog);
router.get('/', communicationController.getAllLogs);
router.get('/:id', communicationController.getLogById);
router.put('/:id', communicationController.updateLog);
router.delete('/:id', communicationController.deleteLog);

module.exports = router;
