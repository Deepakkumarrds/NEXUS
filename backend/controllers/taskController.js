const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { createNotification } = require('../utils/notificationHelper');

// Create a new task
exports.createTask = async (req, res) => {
  try {
    const { title, description, priority, due_date, client_id, assigned_to, is_recurring, recurrence_pattern, recurrence_end, resource_links, checklist, sow_id, sow_item_id, department, is_sow, estimated_hours, is_weekly_target } = req.body;
    
    // Use the logged-in user as the creator
    const creatorId = req.user && req.user.id ? req.user.id : (await prisma.user.findFirst()).id;

    const task = await prisma.task.create({
      data: {
        title,
        description,
        priority: priority || 'Medium',
        due_date: due_date ? new Date(due_date) : null,
        client_id,
        assigned_to: assigned_to || null,
        assigned_by: creatorId, // Required field
        status: 'Pending',
        is_recurring: is_recurring || false,
        recurrence_pattern: recurrence_pattern || null,
        recurrence_end: recurrence_end ? new Date(recurrence_end) : null,
        is_weekly_target: is_weekly_target || false,
        resource_links: resource_links || [],
        checklist: checklist || null,
        department: department || undefined,
        is_sow: is_sow || false,
        sow_id: sow_id || undefined,
        sow_item_id: sow_item_id || undefined,
        estimated_hours: estimated_hours ? parseFloat(estimated_hours) : 1.0
      },
    });

    await createNotification('New Task Assigned', `Task: ${title} (${priority} Priority)`);

    res.status(201).json({ status: 'success', data: task });
  } catch (error) {
    console.error('Error creating task:', error);
    res.status(500).json({ status: 'error', message: 'Failed to create task' });
  }
};

// Create Task from Bot / Webhook (POST /api/tasks/bot-create)
exports.createTaskFromBot = async (req, res) => {
  try {
    const { brand_name, company_name, title, description, priority, due_date, assigned_to_name, assigned_to_email, department } = req.body;

    if (!title) {
      return res.status(400).json({ status: 'error', message: 'Task title is required' });
    }

    const prisma = require('../config/prisma');

    // 1. Resolve Client
    let client = null;
    if (brand_name || company_name) {
      const rawQuery = (brand_name || company_name).toLowerCase().replace(/[^a-z0-9]/g, '');
      const queryTokens = (brand_name || company_name).toLowerCase().split(/\s+/).filter(t => t.length > 2);
      
      const allClients = await prisma.client.findMany({ where: { client_status: 'Active' } });
      
      client = allClients.find(c => {
        const cName = (c.brand_name || c.company_name || '').toLowerCase().replace(/[^a-z0-9]/g, '');
        if (cName.includes(rawQuery) || rawQuery.includes(cName)) return true;
        
        // Fuzzy vowel match (e.g. gauraanga vs gauranga)
        const normQuery = rawQuery.replace(/aa/g, 'a');
        const normName = cName.replace(/aa/g, 'a');
        if (normName.includes(normQuery) || normQuery.includes(normName)) return true;
        
        // Token match (e.g. "gauraanga" or "global")
        return queryTokens.some(tok => normName.includes(tok.replace(/aa/g, 'a')));
      });
    }
    if (!client) {
      client = await prisma.client.findFirst({ where: { client_status: 'Active' } });
    }

    // 2. Resolve Assignee
    let assignee = null;
    if (assigned_to_name || assigned_to_email) {
      const allUsers = await prisma.user.findMany();
      if (assigned_to_email) {
        assignee = allUsers.find(u => u.email.toLowerCase() === assigned_to_email.toLowerCase());
      }
      if (!assignee && assigned_to_name) {
        const nameQuery = assigned_to_name.toLowerCase().trim();
        assignee = allUsers.find(u => u.name.toLowerCase().includes(nameQuery));
      }
    }

    // 3. Resolve Creator
    const firstUser = await prisma.user.findFirst();
    const creatorId = firstUser ? firstUser.id : null;

    // 4. Parse Date
    let parsedDueDate = null;
    if (due_date) {
      const d = new Date(due_date);
      if (!isNaN(d.getTime())) parsedDueDate = d;
    }

    const task = await prisma.task.create({
      data: {
        title,
        description: description || `Created via Bot Integration for ${client?.brand_name || client?.company_name || 'Client'}`,
        priority: priority || 'High',
        due_date: parsedDueDate,
        client_id: client ? client.id : null,
        assigned_to: assignee ? assignee.id : null,
        assigned_by: creatorId,
        status: 'Pending',
        department: department || 'Web Development'
      },
      include: {
        client: { select: { company_name: true, brand_name: true } },
        assignee: { select: { name: true, email: true } }
      }
    });

    const clientDisplayName = task.client?.brand_name || task.client?.company_name || 'Client';
    const assigneeName = task.assignee?.name ? `@${task.assignee.name}` : 'Unassigned';
    const dueDateStr = task.due_date ? new Date(task.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'No due date';

    let responseMsg = `✅ *TASK CREATED SUCCESSFULLY VIA BOT*\n=========================================\n`;
    responseMsg += `• *Task:* "${task.title}"\n`;
    responseMsg += `• *Brand:* ${clientDisplayName}\n`;
    responseMsg += `• *Assignee:* ${assigneeName}\n`;
    responseMsg += `• *Due Date:* ${dueDateStr}\n`;
    responseMsg += `• *Priority:* ${task.priority}\n\n`;
    responseMsg += `🔗 *Open Task Manager:* ${process.env.FRONTEND_URL || 'https://rds-db.vercel.app'}/tasks`;

    res.status(201).json({
      status: 'success',
      text: responseMsg,
      data: task
    });
  } catch (error) {
    console.error('Error creating task from bot:', error);
    res.status(500).json({ status: 'error', message: error.message || 'Failed to create task from bot' });
  }
};

// Delete Task from Bot / Webhook (POST /api/tasks/bot-delete)
exports.deleteTaskFromBot = async (req, res) => {
  try {
    const { task_id, title, brand_name } = req.body;

    const prisma = require('../config/prisma');
    let taskToDelete = null;

    if (task_id) {
      taskToDelete = await prisma.task.findUnique({
        where: { id: task_id },
        include: { client: { select: { company_name: true, brand_name: true } } }
      });
    } else if (title) {
      const cleanTitle = title.toLowerCase().trim();
      const matchingTasks = await prisma.task.findMany({
        include: { client: { select: { company_name: true, brand_name: true } } }
      });

      taskToDelete = matchingTasks.find(t => {
        const titleMatch = t.title.toLowerCase().includes(cleanTitle);
        if (!brand_name) return titleMatch;
        const brandStr = brand_name.toLowerCase().trim();
        const brandMatch = (t.client?.brand_name && t.client.brand_name.toLowerCase().includes(brandStr)) ||
                           (t.client?.company_name && t.client.company_name.toLowerCase().includes(brandStr));
        return titleMatch && brandMatch;
      }) || matchingTasks.find(t => t.title.toLowerCase().includes(cleanTitle));
    }

    if (!taskToDelete) {
      return res.json({
        status: 'error',
        text: `⚠️ *TASK NOT FOUND:* Could not find any task matching "${title || task_id}".`
      });
    }

    await prisma.task.delete({ where: { id: taskToDelete.id } });

    const clientDisplayName = taskToDelete.client?.brand_name || taskToDelete.client?.company_name || 'Client';

    let responseMsg = `🗑️ *TASK DELETED SUCCESSFULLY VIA BOT*\n=========================================\n`;
    responseMsg += `• *Task:* "${taskToDelete.title}"\n`;
    responseMsg += `• *Brand:* ${clientDisplayName}\n\n`;
    responseMsg += `🔗 *Open Task Manager:* ${process.env.FRONTEND_URL || 'https://rds-db.vercel.app'}/tasks`;

    res.status(200).json({
      status: 'success',
      text: responseMsg
    });
  } catch (error) {
    console.error('Error deleting task from bot:', error);
    res.status(500).json({ status: 'error', message: error.message || 'Failed to delete task from bot' });
  }
};

// Get all tasks (with optional client filtering)
exports.getAllTasks = async (req, res) => {
  try {
    const { client_id, assigned_to, is_sow, status } = req.query;
    
    let whereClause = {};
    if (client_id) {
      whereClause.client_id = client_id;
    }
    if (assigned_to) {
      whereClause.assigned_to = assigned_to;
    }
    if (is_sow === 'true') {
      whereClause.is_sow = true;
    }
    if (status) {
      whereClause.status = status;
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

    let dateUpdate = {};
    if (finalStatus === 'In Progress') dateUpdate.started_at = new Date();
    if (finalStatus === 'Review') dateUpdate.review_at = new Date();
    if (finalStatus === 'Completed') dateUpdate.completed_at = new Date();

    const task = await prisma.task.update({
      where: { id },
      data: { 
        status: finalStatus,
        completion_percentage: finalStatus === 'Completed' ? 100 : undefined,
        ...dateUpdate
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
      is_weekly_target,
      resource_links,
      checklist,
      sow_id,
      sow_item_id,
      department,
      is_sow,
      estimated_hours
    } = req.body;

    let dateUpdate = {};
    if (status === 'In Progress') dateUpdate.started_at = new Date();
    if (status === 'Review') dateUpdate.review_at = new Date();
    if (status === 'Completed') dateUpdate.completed_at = new Date();

    const task = await prisma.task.update({
      where: { id },
      data: {
        title,
        description,
        priority,
        due_date: due_date ? new Date(due_date) : undefined,
        status,
        completion_percentage: completion_percentage !== undefined ? parseInt(completion_percentage) : undefined,
        ...dateUpdate,
        assigned_to: assigned_to || undefined,
        delay_reason: delay_reason || undefined,
        delay_notes: delay_notes || undefined,
        original_due_date: original_due_date ? new Date(original_due_date) : undefined,
        is_recurring: is_recurring !== undefined ? is_recurring : undefined,
        recurrence_pattern: recurrence_pattern !== undefined ? recurrence_pattern : undefined,
        recurrence_end: recurrence_end !== undefined ? new Date(recurrence_end) : undefined,
        is_weekly_target: is_weekly_target !== undefined ? is_weekly_target : undefined,
        resource_links: resource_links !== undefined ? resource_links : undefined,
        checklist: checklist || undefined,
        department: department !== undefined ? department : undefined,
        is_sow: is_sow !== undefined ? is_sow : undefined,
        sow_id: sow_id || undefined,
        sow_item_id: sow_item_id || undefined,
        estimated_hours: estimated_hours !== undefined ? parseFloat(estimated_hours) : undefined
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
// Delete a task
exports.deleteTask = async (req, res) => {
  try {
    const { id } = req.params;
    // Prisma does not automatically cascade unless defined, so we clean up related entities
    await prisma.taskComment.deleteMany({ where: { task_id: id } });
    await prisma.activityLog.deleteMany({ where: { module_name: 'Task', reference_id: id } });
    
    await prisma.task.delete({ where: { id } });
    res.status(200).json({ status: 'success', message: 'Task deleted successfully' });
  } catch (error) {
    console.error('Error deleting task:', error);
    res.status(500).json({ status: 'error', message: 'Failed to delete task' });
  }
};
