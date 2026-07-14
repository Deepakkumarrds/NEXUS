const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const getTodayDate = () => {
  const date = new Date();
  date.setUTCHours(0, 0, 0, 0);
  return date;
};

exports.punchIn = async (req, res) => {
  try {
    const userId = req.user.id;
    const today = getTodayDate();
    let attendance = await prisma.attendance.findFirst({
      where: { user_id: userId, date: today }
    });

    if (attendance) {
      return res.status(400).json({ error: 'Already punched in for today.' });
    }

    attendance = await prisma.attendance.create({
      data: {
        user_id: userId,
        date: today,
        login_time: new Date(),
      }
    });

    await prisma.statusLog.create({
      data: {
        attendance_id: attendance.id,
        status: 'Available',
        start_time: new Date()
      }
    });

    await prisma.user.update({
      where: { id: userId },
      data: { current_status: 'Available' }
    });

    res.status(200).json({ message: 'Punched in successfully', attendance });
  } catch (error) {
    console.error('Punch In Error:', error);
    res.status(500).json({ error: 'Failed to punch in' });
  }
};

exports.updateStatus = async (req, res) => {
  try {
    const userId = req.user.id;
    const { status } = req.body;

    const validStatuses = ['Available', 'Tea Break', 'Lunch Break', 'Meeting', 'Offline'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const today = getTodayDate();
    const attendance = await prisma.attendance.findFirst({
      where: { user_id: userId, date: today }
    });

    if (!attendance) {
      return res.status(400).json({ error: 'You must punch in first.' });
    }

    const activeLog = await prisma.statusLog.findFirst({
      where: { attendance_id: attendance.id, end_time: null }
    });

    const now = new Date();

    if (activeLog) {
      const diffMs = now - new Date(activeLog.start_time);
      const diffMins = diffMs / 1000 / 60;
      await prisma.statusLog.update({
        where: { id: activeLog.id },
        data: { end_time: now, duration_minutes: diffMins }
      });
    }

    if (status !== 'Offline') {
      await prisma.statusLog.create({
        data: {
          attendance_id: attendance.id,
          status: status,
          start_time: now
        }
      });
    } else {
      await prisma.attendance.update({
        where: { id: attendance.id },
        data: { logout_time: now }
      });
    }

    await prisma.user.update({
      where: { id: userId },
      data: { current_status: status }
    });

    res.status(200).json({ message: `Status updated to ${status}` });
  } catch (error) {
    console.error('Update Status Error:', error);
    res.status(500).json({ error: 'Failed to update status' });
  }
};

exports.punchOut = async (req, res) => {
  try {
    req.body.status = 'Offline';
    await exports.updateStatus(req, res);
  } catch (error) {
    res.status(500).json({ error: 'Failed to punch out' });
  }
};

exports.getMyStatus = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { current_status: true }
    });
    
    const today = getTodayDate();
    const attendance = await prisma.attendance.findFirst({
      where: { user_id: userId, date: today },
      include: { status_logs: { orderBy: { start_time: 'desc' } } }
    });

    res.status(200).json({ current_status: user.current_status, attendance });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get status' });
  }
};

exports.getTeamStatus = async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      where: { status: 'Active' },
      select: { id: true, name: true, department: true, current_status: true },
      orderBy: { name: 'asc' }
    });
    res.status(200).json({ users });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch team status' });
  }
};
