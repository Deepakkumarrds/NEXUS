const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Create a new task
exports.createTask = async (req, res) => {
  try {
    const { title, description, priority, due_date, client_id } = req.body;
    
    // Fallback: Create a dummy user if none exist to act as creator
    let user = await prisma.user.findFirst();
    if (!user) {
      const role = await prisma.role.upsert({
        where: { role_name: 'Admin' },
        update: {},
        create: { role_name: 'Admin' }
      });
      user = await prisma.user.create({
        data: { name: 'Admin', email: 'admin@test.com', password_hash: '123', role_id: role.id }
      });
    }

    const task = await prisma.task.create({
      data: {
        title,
        description,
        priority: priority || 'Medium',
        due_date: due_date ? new Date(due_date) : null,
        client_id,
        assigned_by: user.id, // Required field
        status: 'Pending'
      },
    });

    res.status(201).json({ status: 'success', data: task });
  } catch (error) {
    console.error('Error creating task:', error);
    res.status(500).json({ status: 'error', message: 'Failed to create task' });
  }
};

// Get all tasks (with optional client filtering)
exports.getAllTasks = async (req, res) => {
  try {
    const { client_id } = req.query;
    
    let whereClause = {};
    if (client_id) {
      whereClause.client_id = client_id;
    }

    const tasks = await prisma.task.findMany({
      where: whereClause,
      include: {
        client: {
          select: { company_name: true }
        },
        assignee: {
          select: { name: true, email: true }
        }
      },
      orderBy: { created_at: 'desc' }
    });
    res.status(200).json({ status: 'success', data: tasks });
  } catch (error) {
    console.error('Error fetching tasks:', error);
    res.status(500).json({ status: 'error', message: 'Failed to fetch tasks' });
  }
};

// Update task status
exports.updateTaskStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { task_status } = req.body;

    const task = await prisma.task.update({
      where: { id },
      data: { status: task_status },
    });

    res.status(200).json({ status: 'success', data: task });
  } catch (error) {
    console.error('Error updating task status:', error);
    res.status(500).json({ status: 'error', message: 'Failed to update task status' });
  }
};

// Get Task by ID
exports.getTaskById = async (req, res) => {
  try {
    const { id } = req.params;
    const task = await prisma.task.findUnique({
      where: { id },
      include: {
        client: { select: { company_name: true } },
        assignee: { select: { name: true, email: true } },
        comments: {
          include: { user: { select: { name: true } } },
          orderBy: { created_at: 'desc' }
        }
      }
    });

    if (!task) {
      return res.status(404).json({ status: 'error', message: 'Task not found' });
    }

    res.status(200).json({ status: 'success', data: task });
  } catch (error) {
    console.error('Error fetching task:', error);
    res.status(500).json({ status: 'error', message: 'Failed to fetch task' });
  }
};

// Add Comment to Task
exports.addTaskComment = async (req, res) => {
  try {
    const { id } = req.params;
    const { comment } = req.body;

    let user = await prisma.user.findFirst();

    const taskComment = await prisma.taskComment.create({
      data: {
        task_id: id,
        user_id: user.id, // Should come from req.user.id with Auth middleware
        comment
      },
      include: {
        user: { select: { name: true } }
      }
    });

    res.status(201).json({ status: 'success', data: taskComment });
  } catch (error) {
    console.error('Error adding comment:', error);
    res.status(500).json({ status: 'error', message: 'Failed to add comment' });
  }
};
