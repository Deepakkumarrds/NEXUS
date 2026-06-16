const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

exports.getDashboardStats = async (req, res) => {
  try {
    // 1. Total active clients
    const totalClients = await prisma.client.count();

    // 2. Open Escalations
    const openEscalations = await prisma.escalation.count({
      where: { status: { in: ['Open', 'In Progress'] } }
    });

    // 3. Pending Tasks
    const pendingTasks = await prisma.task.count({
      where: { status: { not: 'Completed' } }
    });

    // 4. Total SOW Value (Sum of all active SOWs)
    const activeSows = await prisma.sow.findMany({
      where: { status: 'Active' },
      select: { total_value: true }
    });
    
    let totalSowValue = 0;
    activeSows.forEach(sow => {
      if (sow.total_value) totalSowValue += sow.total_value;
    });

    // 5. Recent Activity (Latest tasks, escalations, meetings)
    const recentTasks = await prisma.task.findMany({
      take: 5,
      orderBy: { created_at: 'desc' },
      include: { client: { select: { company_name: true } } }
    });

    // Role-Based Financial Privacy
    if (req.query.role === 'Team Member') {
      totalSowValue = null;
    }

    res.status(200).json({
      status: 'success',
      data: {
        totalClients,
        openEscalations,
        pendingTasks,
        totalSowValue,
        recentTasks
      }
    });

  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({ status: 'error', message: 'Failed to fetch dashboard stats' });
  }
};
