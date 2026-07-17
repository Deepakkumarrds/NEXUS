const cron = require('node-cron');
const { PrismaClient } = require('@prisma/client');
const emailService = require('./emailService');
const reportGenerator = require('../utils/reportGenerator');
const { sendMessage } = require('./whatsappService');

const prisma = new PrismaClient();

const startCronJobs = () => {
  console.log('🕒 Initializing Cron Jobs...');

  // Dynamic Morning Tracker Reminders (Every 5 mins, Mon-Fri)
  cron.schedule('*/5 * * * 1-5', async () => {
    await evaluateAndSendTrackerReminders('Morning');
  });

  // Static Evening Tracker Reminders (6:00 PM, Mon-Fri)
  cron.schedule('0 18 * * 1-5', async () => {
    await evaluateAndSendTrackerReminders('Evening');
  });

  // Run every day at 9:00 AM server time
  // For testing, we can run it every minute '* * * * *', but daily is '0 9 * * *'
  cron.schedule('0 9 * * *', async () => {
    console.log('🕒 Running Daily Asset Deadline Check...');
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      // Find assets due today that are still pending
      const dueAssets = await prisma.creativeAsset.findMany({
        where: {
          client_status: 'Pending',
          internal_status: 'Client Review',
          due_date: {
            gte: today,
            lt: tomorrow
          }
        },
        include: {
          client: {
            include: {
              client_users: true
            }
          }
        }
      });

      console.log(`Found ${dueAssets.length} assets due today.`);

      for (const asset of dueAssets) {
        // Send email to all client users associated with this client
        for (const user of asset.client.client_users) {
          await emailService.sendDeadlineReminder(
            user.email,
            asset.title,
            'http://localhost:3000/portal/login' // In prod, use process.env.FRONTEND_URL
          );
        }
      }
    } catch (err) {
      console.error('Error running cron job:', err);
    }
  });


  // Auto Punch-out at 8:00 PM (20:00) server time
  cron.schedule('0 20 * * *', async () => {
    console.log('🕒 Running Auto Punch-out...');
    try {
      const now = new Date();
      const today = new Date();
      today.setUTCHours(0, 0, 0, 0);

      // Find all users who are not offline
      const activeUsers = await prisma.user.findMany({
        where: { 
          status: 'Active',
          current_status: { not: 'Offline' }
        }
      });

      for (const user of activeUsers) {
        // Find their active attendance for today
        const attendance = await prisma.attendance.findFirst({
          where: { user_id: user.id, date: today, logout_time: null }
        });

        if (attendance) {
          // Close active status log
          const activeLog = await prisma.statusLog.findFirst({
            where: { attendance_id: attendance.id, end_time: null }
          });
          if (activeLog) {
            const diffMs = now - new Date(activeLog.start_time);
            const diffMins = diffMs / 1000 / 60;
            await prisma.statusLog.update({
              where: { id: activeLog.id },
              data: { end_time: now, duration_minutes: diffMins }
            });
          }

          // Punch out
          await prisma.attendance.update({
            where: { id: attendance.id },
            data: { logout_time: now }
          });
        }

        // Update user status
        await prisma.user.update({
          where: { id: user.id },
          data: { current_status: 'Offline' }
        });

        if (global.io) {
          global.io.to(`user_${user.id}`).emit('attendance_update', { message: 'Auto-punched out at 8 PM' });
        }
      }
      console.log(`Successfully auto-punched out ${activeUsers.length} users.`);
    } catch (err) {
      console.error('Error running auto punch-out cron job:', err);
    }
  });
};

const evaluateAndSendTrackerReminders = async (timeOfDay) => {
  console.log(`🕒 Running ${timeOfDay} Tracker Reminders...`);
  try {
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    const activeClients = await prisma.client.findMany({ where: { client_status: 'Active' }, select: { id: true, company_name: true }});
    
    let targetUsers = [];
    if (timeOfDay === 'Morning') {
      const fortyFiveMinsAgo = new Date(Date.now() - 45 * 60000);
      const thirtyMinsAgo = new Date(Date.now() - 25 * 60000); // 25-45 mins to be safe
      
      const recentLogins = await prisma.loginLog.findMany({
        where: { login_time: { gte: fortyFiveMinsAgo, lte: thirtyMinsAgo } },
        include: { user: { include: { role: true } } }
      });
      targetUsers = recentLogins.map(l => l.user).filter(u => u && u.status === 'Active' && u.role.role_name !== 'Client');
    } else {
      targetUsers = await prisma.user.findMany({ 
        where: { status: 'Active', role: { role_name: { notIn: ['Client', 'Super Admin'] } } },
        include: { role: true }
      });
    }

    if (targetUsers.length === 0) return;

    const uniqueUsers = Array.from(new Map(targetUsers.map(u => [u.id, u])).values());
    const trackers = await prisma.dailyTracker.findMany({ where: { date: today } });
    
    for (const user of uniqueUsers) {
      if (!user.department || user.department === 'All Departments') continue; // Only specific departments need tracking
      
      const missingClients = [];
      for (const client of activeClients) {
        const hasTracker = trackers.some(t => t.client_id === client.id && t.department === user.department);
        if (!hasTracker) {
          missingClients.push(client.company_name);
        }
      }

      if (missingClients.length > 0) {
        if (user.email) {
          await emailService.sendDailyTrackerReminder(user.email, user.name, missingClients, timeOfDay);
        }
        if (user.phone) {
          const msg = timeOfDay === 'Morning' 
            ? `*Good morning, ${user.name}!* 🌅\nYou logged in a bit ago. Please log your initial Daily Tracker tasks for:\n`
            : `*Good evening, ${user.name}!* 🌙\nBefore you log off, please ensure your Daily Trackers are updated for:\n`;
          
          const clientList = missingClients.map(c => `- ${c}`).join('\n');
          await sendMessage(user.phone, msg + clientList + `\n\nLink: ${process.env.FRONTEND_URL || 'http://localhost:3000'}/tracker`);
        }
      }
    }
  } catch (err) {
    console.error(`Error in ${timeOfDay} tracker reminder cron:`, err);
  }
};

const sendWeeklyReportsNow = async (clientIds = []) => {
  try {
    const now = new Date();
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    // Build the query. If clientIds are provided, restrict to those.
    const whereClause = { client_status: 'Active' };
    if (clientIds && clientIds.length > 0) {
      whereClause.id = { in: clientIds };
    }

    const clients = await prisma.client.findMany({
      where: whereClause,
      include: {
        tasks: { 
          where: { 
            OR: [
              { status: 'Completed', updated_at: { gte: sevenDaysAgo } },
              { status: { in: ['Pending', 'In Progress', 'Review'] } }
            ]
          } 
        },
        communications: { where: { created_at: { gte: sevenDaysAgo } } },
        meetings: { where: { meeting_date: { gte: sevenDaysAgo, lte: now } } },
        escalations: { where: { status: 'Resolved', resolved_at: { gte: sevenDaysAgo } } },
        sows: { where: { created_at: { gte: sevenDaysAgo } } },
        campaign_performances: true
      }
    });

    const settings = await prisma.globalSettings.findFirst();

    for (const client of clients) {
      if (!client.email) continue;
      
      const completedTasks = client.tasks.filter(t => t.status === 'Completed');
      const pendingTasks = client.tasks.filter(t => t.status !== 'Completed');

      const reportHtml = reportGenerator.generateWeeklyReportHtml(
        client, 
        completedTasks,
        pendingTasks,
        client.campaign_performances,
        client.communications, 
        client.meetings, 
        client.escalations,
        settings
      );
      
      try {
        await emailService.sendWeeklyReportEmail(client.email, client.company_name, reportHtml);
        await prisma.reportDeliveryLog.create({
          data: {
            client_id: client.id,
            status: 'Success'
          }
        });
      } catch (err) {
        await prisma.reportDeliveryLog.create({
          data: {
            client_id: client.id,
            status: 'Failed',
            error_message: err.message
          }
        });
      }
    }
    return { success: true, count: clients.length };
  } catch (err) {
    console.error('Error sending reports manually:', err);
    throw err;
  }
};

const generateReportHtmlForClient = async (clientId) => {
  const now = new Date();
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const client = await prisma.client.findUnique({
    where: { id: clientId },
    include: {
      tasks: { 
        where: { 
          OR: [
            { status: 'Completed', updated_at: { gte: sevenDaysAgo } },
            { status: { in: ['Pending', 'In Progress', 'Review'] } }
          ]
        } 
      },
      communications: { where: { created_at: { gte: sevenDaysAgo } } },
      meetings: { where: { meeting_date: { gte: sevenDaysAgo, lte: now } } },
      escalations: { where: { status: 'Resolved', resolved_at: { gte: sevenDaysAgo } } },
      sows: { where: { created_at: { gte: sevenDaysAgo } } },
      campaign_performances: true
    }
  });

  const settings = await prisma.globalSettings.findFirst();
  
  if (!client) throw new Error('Client not found');

  const completedTasks = client.tasks.filter(t => t.status === 'Completed');
  const pendingTasks = client.tasks.filter(t => t.status !== 'Completed');

  return reportGenerator.generateWeeklyReportHtml(
    client, 
    completedTasks,
    pendingTasks,
    client.campaign_performances,
    client.communications, 
    client.meetings, 
    client.escalations,
    settings
  );
};

module.exports = {
  startCronJobs,
  sendWeeklyReportsNow,
  generateReportHtmlForClient
};
