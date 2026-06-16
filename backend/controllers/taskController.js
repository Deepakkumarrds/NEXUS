const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { createNotification } = require('../utils/notificationHelper');

// Create a new task
exports.createTask = async (req, res) => {
  try {
    const { title, description, priority, due_date, client_id, assigned_to, is_recurring, recurrence_pattern, recurrence_end, resource_links, checklist } = req.body;
    
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
        assigned_to: assigned_to || null,
        assigned_by: user.id, // Required field
        status: 'Pending',
        is_recurring: is_recurring || false,
        recurrence_pattern: recurrence_pattern || null,
        recurrence_end: recurrence_end ? new Date(recurrence_end) : null,
        resource_links: resource_links || [],
        checklist: checklist || null
      },
    });

    await createNotification('New Task Assigned', `Task: ${title} (${priority} Priority)`);

    res.status(201).json({ status: 'success', data: task });
  } catch (error) {
    console.error('Error creating task:', error);
    res.status(500).json({ status: 'error', message: 'Failed to create task' });
  }
};

// Get all tasks (with optional client filtering)
exports.getAllTasks = async (req, res) => {
  try {
    const { client_id, assigned_to } = req.query;
    
    let whereClause = {};
    if (client_id) {
      whereClause.client_id = client_id;
    }
    if (assigned_to) {
      whereClause.assigned_to = assigned_to;
    }

    const tasks = await prisma.task.findMany({
      where: whereClause,
      include: {
        client: {
          select: { company_name: true }
        },
        assignee: {
          select: { name: true, email: true }
        },
        creator: {
          select: { name: true }
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
    const { status, task_status } = req.body;
    const finalStatus = status || task_status;

    const task = await prisma.task.update({
      where: { id },
      data: { 
        status: finalStatus,
        completion_percentage: finalStatus === 'Completed' ? 100 : undefined
      },
    });

    // Log the activity
    const user = await prisma.user.findFirst(); // Replace with actual user in auth
    if (user) {
      await prisma.activityLog.create({
        data: {
          user_id: user.id,
          module_name: 'Task',
          action_type: 'Update Status',
          reference_id: task.id,
          description: `Task status changed to ${finalStatus}`
        }
      });
    }

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

    // Fetch activity logs
    const activities = await prisma.activityLog.findMany({
      where: { module_name: 'Task', reference_id: task.id },
      include: { user: { select: { name: true } } },
      orderBy: { created_at: 'desc' }
    });

    res.status(200).json({ status: 'success', data: { ...task, activity_logs: activities } });
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

// Update task details (supporting delay reasons, recurrence, assignees, etc.)
exports.updateTask = async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      title, 
      description, 
      priority, 
      due_date, 
      status, 
      completion_percentage, 
      assigned_to, 
      delay_reason, 
      delay_notes, 
      original_due_date, 
      is_recurring, 
      recurrence_pattern, 
      recurrence_end,
      resource_links,
      checklist
    } = req.body;

    const task = await prisma.task.update({
      where: { id },
      data: {
        title,
        description,
        priority,
        due_date: due_date ? new Date(due_date) : undefined,
        status,
        completion_percentage: completion_percentage !== undefined ? parseInt(completion_percentage) : undefined,
        assigned_to: assigned_to || undefined,
        delay_reason: delay_reason || undefined,
        delay_notes: delay_notes || undefined,
        original_due_date: original_due_date ? new Date(original_due_date) : undefined,
        is_recurring,
        recurrence_pattern,
        recurrence_end: recurrence_end ? new Date(recurrence_end) : undefined,
        resource_links: resource_links || undefined,
        checklist: checklist || undefined
      }
    });

    res.status(200).json({ status: 'success', data: task });
  } catch (error) {
    console.error('Error updating task:', error);
    res.status(500).json({ status: 'error', message: 'Failed to update task' });
  }
};

// Bulk update task status
exports.bulkUpdateStatus = async (req, res) => {
  try {
    const { taskIds, status } = req.body;
    if (!taskIds || !taskIds.length || !status) {
      return res.status(400).json({ status: 'error', message: 'Invalid input' });
    }
    
    await prisma.task.updateMany({
      where: { id: { in: taskIds } },
      data: { status, completion_percentage: status === 'Completed' ? 100 : undefined }
    });
    
    // Log activities for all
    const user = await prisma.user.findFirst();
    if (user) {
      const logs = taskIds.map(id => ({
        user_id: user.id,
        module_name: 'Task',
        action_type: 'Bulk Update Status',
        reference_id: id,
        description: `Task status bulk updated to ${status}`
      }));
      await prisma.activityLog.createMany({ data: logs });
    }

    res.status(200).json({ status: 'success', message: 'Tasks updated successfully' });
  } catch (error) {
    console.error('Error in bulk update:', error);
    res.status(500).json({ status: 'error', message: 'Failed to bulk update tasks' });
  }
};

// Create a task from MOM action item
exports.createTaskFromActionItem = async (req, res) => {
  try {
    const { actionItemId } = req.params;
    const actionItem = await prisma.meetingActionItem.findUnique({
      where: { id: actionItemId },
      include: { meeting: true }
    });
    if (!actionItem) return res.status(404).json({ status: 'error', message: 'Action item not found' });
    
    const user = await prisma.user.findFirst();
    const task = await prisma.task.create({
      data: {
        title: actionItem.action_item,
        client_id: actionItem.meeting.client_id,
        assigned_to: actionItem.assigned_to,
        assigned_by: user.id,
        due_date: actionItem.deadline,
        status: 'Pending',
        priority: 'Medium'
      }
    });
    
    res.status(201).json({ status: 'success', data: task });
  } catch (error) {
    console.error('Error creating task from action item:', error);
    res.status(500).json({ status: 'error', message: 'Failed to create task' });
  }
};

// Clone a task
exports.cloneTask = async (req, res) => {
  try {
    const { id } = req.params;
    const taskToClone = await prisma.task.findUnique({ where: { id } });
    if (!taskToClone) return res.status(404).json({ status: 'error', message: 'Task not found' });
    
    const { id: _, created_at, updated_at, ...taskData } = taskToClone;
    taskData.title = `Copy of ${taskData.title}`;
    taskData.status = 'Pending';
    taskData.completion_percentage = 0;
    
    const newTask = await prisma.task.create({ data: taskData });
    res.status(201).json({ status: 'success', data: newTask });
  } catch (error) {
    console.error('Error cloning task:', error);
    res.status(500).json({ status: 'error', message: 'Failed to clone task' });
  }
};

