const express = require('express');
const router = express.Router();
const taskController = require('../controllers/taskController');

// Routes
router.post('/', taskController.createTask);
router.get('/', taskController.getAllTasks);
router.patch('/:id/status', taskController.updateTaskStatus);

module.exports = router;
