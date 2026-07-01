const express = require('express');
const router = express.Router();
const taskController = require('../controllers/taskController');

// Routes
router.post('/', taskController.createTask);
router.get('/', taskController.getAllTasks);

// Bulk status update (must be before /:id)
router.put('/bulk-status', taskController.bulkUpdateStatus);

// Create task from MOM action item
router.post('/from-action-item/:actionItemId', taskController.createTaskFromActionItem);

// GET a single task
router.get('/:id', taskController.getTaskById);

// PATCH task status
router.patch('/:id/status', taskController.updateTaskStatus);

// PUT (update) task details
router.put('/:id', taskController.updateTask);

// Clone a task
router.post('/:id/clone', taskController.cloneTask);

// DELETE a task
router.delete('/:id', taskController.deleteTask);

// POST a comment to a task
router.post('/:id/comments', taskController.addTaskComment);

module.exports = router;
