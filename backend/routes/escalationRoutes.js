const express = require('express');
const router = express.Router();
const escalationController = require('../controllers/escalationController');

router.post('/', escalationController.createEscalation);
router.get('/', escalationController.getAllEscalations);
router.patch('/:id/status', escalationController.updateEscalationStatus);
router.delete('/:id', escalationController.deleteEscalation);

module.exports = router;
