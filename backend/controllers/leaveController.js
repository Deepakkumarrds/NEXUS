const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Get all leave records (optionally filter by user_id)
exports.getAllLeaves = async (req, res) => {
  try {
    const { user_id } = req.query;
    let whereClause = {};
    if (user_id) {
      whereClause.user_id = user_id;
    }

    const leaves = await prisma.leaveRecord.findMany({
      where: whereClause,
      include: {
        user: { select: { name: true, email: true, department: true } }
      },
      orderBy: { start_date: 'desc' }
    });
    res.status(200).json({ status: 'success', data: leaves });
  } catch (error) {
    console.error('Error fetching leaves:', error);
    res.status(500).json({ status: 'error', message: 'Failed to fetch leaves' });
  }
};

// Create a new leave request
exports.requestLeave = async (req, res) => {
  try {
    const { user_id, start_date, end_date, leave_type } = req.body;
    
    // Check if user exists
    const userExists = await prisma.user.findUnique({ where: { id: user_id } });
    if (!userExists) {
      return res.status(404).json({ status: 'error', message: 'User not found' });
    }

    const leave = await prisma.leaveRecord.create({
      data: {
        user_id,
        start_date: new Date(start_date),
        end_date: new Date(end_date),
        leave_type,
        status: 'Pending'
      }
    });

    res.status(201).json({ status: 'success', data: leave });
  } catch (error) {
    console.error('Error requesting leave:', error);
    res.status(500).json({ status: 'error', message: 'Failed to request leave' });
  }
};

// Approve or Reject a leave request
exports.updateLeaveStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body; // Approved or Rejected

    if (!['Approved', 'Rejected', 'Pending'].includes(status)) {
      return res.status(400).json({ status: 'error', message: 'Invalid status value' });
    }

    const leave = await prisma.leaveRecord.update({
      where: { id },
      data: { status }
    });

    res.status(200).json({ status: 'success', data: leave });
  } catch (error) {
    console.error('Error updating leave status:', error);
    res.status(500).json({ status: 'error', message: 'Failed to update leave status' });
  }
};
