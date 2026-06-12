const express = require('express');
const router = express.Router();
const sowController = require('../controllers/sowController');

// Routes
router.post('/', sowController.createSow);
router.get('/', sowController.getAllSows);
router.patch('/items/:id/status', sowController.updateSowItemStatus);

module.exports = router;
