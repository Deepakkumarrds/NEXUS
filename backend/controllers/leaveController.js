const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Helper to get or create leave balance for the year
async function getOrCreateLeaveBalance(userId, year) {
  let balance = await prisma.leaveBalance.findUnique({
    where: { user_id_year: { user_id: userId, year } }
  });

  if (!balance) {
    balance = await prisma.leaveBalance.create({
      data: {
        user_id: userId,
        year,
        sick_leaves_total: 12,
        casual_leaves_total: 12,
        earned_leaves_total: 0
      }
    });
  }
  return balance;
}

exports.applyLeave = async (req, res) => {
  try {
    const userId = req.user.id;
    const { start_date, end_date, leave_type, reason } = req.body;

    if (!start_date || !end_date || !leave_type) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const year = new Date(start_date).getFullYear();
    const balance = await getOrCreateLeaveBalance(userId, year);

    // Simplistic days calculation (does not exclude weekends or holidays yet, but works for MVP)
    const start = new Date(start_date);
    const end = new Date(end_date);
    const diffTime = Math.abs(end - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // inclusive

    // Check balances (only if sick or casual)
    if (leave_type === 'Sick' && (balance.sick_leaves_used + diffDays > balance.sick_leaves_total)) {
      return res.status(400).json({ error: 'Insufficient Sick Leave balance' });
    }
    if (leave_type === 'Casual' && (balance.casual_leaves_used + diffDays > balance.casual_leaves_total)) {
      return res.status(400).json({ error: 'Insufficient Casual Leave balance' });
    }
    if (leave_type === 'Earned' && (balance.earned_leaves_used + diffDays > balance.earned_leaves_total)) {
      return res.status(400).json({ error: 'Insufficient Earned Leave balance' });
    }

    // Deduct tentative balance immediately to prevent double booking
    const updateData = {};
    if (leave_type === 'Sick') updateData.sick_leaves_used = balance.sick_leaves_used + diffDays;
    else if (leave_type === 'Casual') updateData.casual_leaves_used = balance.casual_leaves_used + diffDays;
    else if (leave_type === 'Earned') updateData.earned_leaves_used = balance.earned_leaves_used + diffDays;

    await prisma.leaveBalance.update({
      where: { id: balance.id },
      data: updateData
    });

    const leaveRequest = await prisma.leaveRecord.create({
      data: {
        user_id: userId,
        start_date: start,
        end_date: end,
        leave_type,
        reason,
        status: 'Pending'
      }
    });

    res.status(201).json({ status: 'success', data: leaveRequest });
  } catch (error) {
    console.error('Apply leave error:', error);
    res.status(500).json({ error: 'Failed to apply for leave' });
  }
};

exports.getMyLeaves = async (req, res) => {
  try {
    const userId = req.user.id;
    const year = new Date().getFullYear();

    const balance = await getOrCreateLeaveBalance(userId, year);
    const history = await prisma.leaveRecord.findMany({
      where: { user_id: userId },
      orderBy: { created_at: 'desc' }
    });

    res.status(200).json({ status: 'success', balance, history });
  } catch (error) {
    console.error('Get my leaves error:', error);
    res.status(500).json({ error: 'Failed to get leaves' });
  }
};

exports.getPendingLeaves = async (req, res) => {
  try {
    const pending = await prisma.leaveRecord.findMany({
      where: { status: 'Pending' },
      include: {
        user: { select: { name: true, email: true, department: true } }
      },
      orderBy: { created_at: 'desc' }
    });

    res.status(200).json({ status: 'success', pending });
  } catch (error) {
    console.error('Get pending leaves error:', error);
    res.status(500).json({ error: 'Failed to get pending leaves' });
  }
};

exports.approveLeave = async (req, res) => {
  try {
    const approverId = req.user.id;
    const { id } = req.params;

    const leave = await prisma.leaveRecord.update({
      where: { id },
      data: { status: 'Approved', approved_by: approverId }
    });

    res.status(200).json({ status: 'success', data: leave });
  } catch (error) {
    console.error('Approve leave error:', error);
    res.status(500).json({ error: 'Failed to approve leave' });
  }
};

exports.rejectLeave = async (req, res) => {
  try {
    const approverId = req.user.id;
    const { id } = req.params;

    const leave = await prisma.leaveRecord.findUnique({ where: { id } });
    if (!leave || leave.status !== 'Pending') {
      return res.status(400).json({ error: 'Leave not found or not pending' });
    }

    // Refund balance
    const start = new Date(leave.start_date);
    const end = new Date(leave.end_date);
    const diffDays = Math.ceil(Math.abs(end - start) / (1000 * 60 * 60 * 24)) + 1;
    const year = start.getFullYear();

    const balance = await prisma.leaveBalance.findUnique({
      where: { user_id_year: { user_id: leave.user_id, year } }
    });

    if (balance) {
      const updateData = {};
      if (leave.leave_type === 'Sick') updateData.sick_leaves_used = balance.sick_leaves_used - diffDays;
      else if (leave.leave_type === 'Casual') updateData.casual_leaves_used = balance.casual_leaves_used - diffDays;
      else if (leave.leave_type === 'Earned') updateData.earned_leaves_used = balance.earned_leaves_used - diffDays;

      await prisma.leaveBalance.update({
        where: { id: balance.id },
        data: updateData
      });
    }

    const updatedLeave = await prisma.leaveRecord.update({
      where: { id },
      data: { status: 'Rejected', approved_by: approverId }
    });

    res.status(200).json({ status: 'success', data: updatedLeave });
  } catch (error) {
    console.error('Reject leave error:', error);
    res.status(500).json({ error: 'Failed to reject leave' });
  }
};

exports.getAttendanceReport = async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: { id: true, name: true, department: true }
    });

    const report = [];
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    for (const user of users) {
      // Working days (distinct attendances in current month)
      const attendances = await prisma.attendance.findMany({
        where: {
          user_id: user.id,
          date: {
            gte: new Date(currentYear, currentMonth, 1),
            lt: new Date(currentYear, currentMonth + 1, 1)
          }
        }
      });

      // Approved leaves
      const leaves = await prisma.leaveRecord.findMany({
        where: {
          user_id: user.id,
          status: 'Approved',
          start_date: {
            gte: new Date(currentYear, currentMonth, 1)
          }
        }
      });

      let leaveDays = 0;
      for (const leave of leaves) {
        const start = new Date(leave.start_date);
        const end = new Date(leave.end_date);
        leaveDays += Math.ceil(Math.abs(end - start) / (1000 * 60 * 60 * 24)) + 1;
      }

      report.push({
        id: user.id,
        name: user.name,
        department: user.department,
        workingDays: attendances.length,
        leaveDays
      });
    }

    res.status(200).json({ status: 'success', report });
  } catch (error) {
    console.error('Report error:', error);
    res.status(500).json({ error: 'Failed to generate report' });
  }
};
