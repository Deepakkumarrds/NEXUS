const express = require('express');
const router = express.Router();
const communicationController = require('../controllers/communicationController');

// Routes
router.post('/', communicationController.createLog);
router.get('/', communicationController.getAllLogs);

module.exports = router;
