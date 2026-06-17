const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Create a new communication log
exports.createLog = async (req, res) => {
  try {
    const { client_id, communication_type, subject, summary, next_action, follow_up_date } = req.body;
    
    // Fallback: Use a dummy user as the creator since auth isn't built yet
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

    const log = await prisma.communicationLog.create({
      data: {
        client_id,
        communication_type,
        subject,
        summary,
        next_action,
        follow_up_date: follow_up_date ? new Date(follow_up_date) : null,
        created_by: user.id
      },
    });

    res.status(201).json({ status: 'success', data: log });
  } catch (error) {
    console.error('Error creating communication log:', error);
    res.status(500).json({ status: 'error', message: 'Failed to create communication log' });
  }
};

// Get all logs
exports.getAllLogs = async (req, res) => {
  try {
    const logs = await prisma.communicationLog.findMany({
      include: {
        client: { select: { company_name: true } },
        creator: { select: { name: true } }
      },
      orderBy: { created_at: 'desc' }
    });
    res.status(200).json({ status: 'success', data: logs });
  } catch (error) {
    console.error('Error fetching logs:', error);
    res.status(500).json({ status: 'error', message: 'Failed to fetch logs' });
  }
};

// Get log by ID
exports.getLogById = async (req, res) => {
  try {
    const { id } = req.params;
    const log = await prisma.communicationLog.findUnique({
      where: { id },
      include: {
        client: { select: { company_name: true } }
      }
    });
    if (!log) return res.status(404).json({ status: 'error', message: 'Log not found' });
    res.status(200).json({ status: 'success', data: log });
  } catch (error) {
    console.error('Error fetching log:', error);
    res.status(500).json({ status: 'error', message: 'Failed to fetch log' });
  }
};

// Update a log
exports.updateLog = async (req, res) => {
  try {
    const { id } = req.params;
    const { is_pinned, client_id, communication_type, subject, summary, next_action, follow_up_date } = req.body;
    
    const updateData = {};
    if (is_pinned !== undefined) updateData.is_pinned = is_pinned;
    if (client_id !== undefined) updateData.client_id = client_id;
    if (communication_type !== undefined) updateData.communication_type = communication_type;
    if (subject !== undefined) updateData.subject = subject;
    if (summary !== undefined) updateData.summary = summary;
    if (next_action !== undefined) updateData.next_action = next_action;
    if (follow_up_date !== undefined) updateData.follow_up_date = follow_up_date ? new Date(follow_up_date) : null;

    const log = await prisma.communicationLog.update({
      where: { id },
      data: updateData
    });
    res.status(200).json({ status: 'success', data: log });
  } catch (error) {
    console.error('Error updating log:', error);
    res.status(500).json({ status: 'error', message: 'Failed to update log' });
  }
};

// Delete a log
exports.deleteLog = async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.communicationLog.delete({
      where: { id }
    });
    res.status(200).json({ status: 'success', message: 'Log deleted successfully' });
  } catch (error) {
    console.error('Error deleting log:', error);
    res.status(500).json({ status: 'error', message: 'Failed to delete log' });
  }
};
