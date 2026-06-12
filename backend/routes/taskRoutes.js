const express = require('express');
const router = express.Router();
const taskController = require('../controllers/taskController');

// Routes
router.post('/', taskController.createTask);
router.get('/', taskController.getAllTasks);
// GET a single task
router.get('/:id', taskController.getTaskById);

// PATCH task status
router.patch('/:id/status', taskController.updateTaskStatus);

// POST a comment to a task
router.post('/:id/comments', taskController.addTaskComment);

module.exports = router;
