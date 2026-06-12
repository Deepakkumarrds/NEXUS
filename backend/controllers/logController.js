const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

exports.getLogs = async (req, res) => {
  try {
    const loginLogs = await prisma.loginLog.findMany({
      include: { user: { select: { name: true, email: true } } },
      orderBy: { login_time: 'desc' },
      take: 20
    });

    const activityLogs = await prisma.activityLog.findMany({
      include: { user: { select: { name: true, email: true } } },
      orderBy: { created_at: 'desc' },
      take: 20
    });

    res.status(200).json({
      status: 'success',
      data: {
        loginLogs,
        activityLogs
      }
    });
  } catch (error) {
    console.error('Error fetching logs:', error);
    res.status(500).json({ status: 'error', message: 'Failed to fetch logs' });
  }
};
