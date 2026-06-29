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

    // 6. Department Task Breakdown
    const departmentStats = await prisma.task.groupBy({
      by: ['department'],
      where: { status: { not: 'Completed' }, department: { not: null } },
      _count: { id: true }
    });
    const departmentTasks = departmentStats.map(stat => ({
      department: stat.department,
      count: stat._count.id
    }));

    // 7. Upcoming Deadlines
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const upcomingDeadlines = await prisma.task.findMany({
      where: {
        due_date: { gte: today },
        status: { not: 'Completed' }
      },
      take: 5,
      orderBy: { due_date: 'asc' },
      include: { client: { select: { company_name: true } } }
    });

    // 8. Recent Activity Feed (Communications)
    const recentActivity = await prisma.communicationLog.findMany({
      take: 5,
      orderBy: { created_at: 'desc' },
      include: { client: { select: { company_name: true } }, creator: { select: { name: true } } }
    });

    // 9. Team Performance Snapshot
    const teamStats = await prisma.task.groupBy({
      by: ['assigned_to'],
      where: { status: 'Completed', assigned_to: { not: null } },
      _sum: { estimated_hours: true }
    });
    
    // Fetch user names for team performance
    const teamPerformance = await Promise.all(teamStats.map(async (stat) => {
      const user = await prisma.user.findUnique({ where: { id: stat.assigned_to }, select: { name: true } });
      return {
        name: user ? user.name : 'Unknown',
        points: stat._sum.estimated_hours || 0
      };
    }));
    teamPerformance.sort((a, b) => b.points - a.points);

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
        recentTasks,
        departmentTasks,
        upcomingDeadlines,
        recentActivity,
        teamPerformance: teamPerformance.slice(0, 5) // Top 5
      }
    });

  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({ status: 'error', message: 'Failed to fetch dashboard stats' });
  }
};
