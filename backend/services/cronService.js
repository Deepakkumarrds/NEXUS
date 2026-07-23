const cron = require('node-cron');
const { PrismaClient } = require('@prisma/client');
const emailService = require('./emailService');
const reportGenerator = require('../utils/reportGenerator');
const { sendMessage } = require('./whatsappService');
const { sendCliqNotification } = require('./cliqService');
const sowPredictorService = require('./sowPredictorService');

const prisma = new PrismaClient();

const startCronJobs = () => {
  console.log('🕒 Initializing Cron Jobs...');

  const IST = { timezone: "Asia/Kolkata" };

  // Daily SOW Breach Check (9:30 AM IST, Mon-Fri)
  cron.schedule('30 9 * * 1-5', async () => {
    console.log('🛡️ Running Daily SOW Breach Check...');
    try {
      await sowPredictorService.checkSowBreaches();
    } catch (e) {
      console.error('Error running SOW Breach check:', e);
    }
  }, IST);

  // 11:00 AM IST Daily Summary Deadline Check & SPOC Tagging (Mon-Sat)
  cron.schedule('0 11 * * 1-6', async () => {
    await send11AmDailySummaryCheck();
  }, IST);

  // Static Evening Tracker & Task Closing Reminders (6:00 PM, 6:30 PM, 7:00 PM IST, Mon-Sat)
  cron.schedule('0 18 * * 1-6', async () => {
    await sendTaskClosingReminders('6:00 PM IST');
    await evaluateAndSendTrackerReminders('Evening');
    await sendDailyTaskSummaryToCliq();
  }, IST);

  cron.schedule('30 18 * * 1-6', async () => {
    await sendTaskClosingReminders('6:30 PM IST');
  }, IST);

  cron.schedule('0 19 * * 1-6', async () => {
    await sendTaskClosingReminders('7:00 PM IST');
    await sendDetailedDailyReportToCliq();
  }, IST);

  // Recurring check for tasks exceeding estimated duration (Every 30 mins)
  cron.schedule('*/30 * * * *', async () => {
    await checkTaskOverrunAlerts();
  }, IST);

  // Check & Process 30-minute scheduled MOM dispatches (Every 5 mins)
  cron.schedule('*/5 * * * *', async () => {
    await processScheduledMomDispatches();
  }, IST);

  // Daily Asset Deadline Check (9:00 AM IST)
  cron.schedule('0 9 * * *', async () => {
    console.log('🕒 Running Daily Asset Deadline Check (IST)...');
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
            `${process.env.FRONTEND_URL || 'http://localhost:3000'}/portal/login`

          );
        }
      }
    } catch (err) {
      console.error('Error running cron job:', err);
    }
  }, IST);


  // Auto Punch-out at 8:00 PM IST (20:00)
  cron.schedule('0 20 * * *', async () => {
    console.log('🕒 Running Auto Punch-out (8:00 PM IST)...');
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

const sendDailyTaskSummaryToCliq = async () => {
  console.log('🕒 Generating Daily Task & Operations Summary for Zoho Cliq...');
  try {
    const todayStart = new Date();
    todayStart.setUTCHours(0, 0, 0, 0);

    const [completedToday, pendingTotal, overdueTotal, trackersToday, openEscalations] = await Promise.all([
      prisma.task.count({ where: { status: 'Completed', updated_at: { gte: todayStart } } }),
      prisma.task.count({ where: { status: { in: ['Pending', 'In Progress', 'Review'] } } }),
      prisma.task.count({ where: { status: { in: ['Pending', 'In Progress'] }, due_date: { lt: todayStart } } }),
      prisma.dailyTracker.count({ where: { date: todayStart } }),
      prisma.escalation.count({ where: { status: 'Open' } })
    ]);

    const formattedDate = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'short', day: 'numeric' });

    const summaryText = `📊 *DAILY OPERATIONS & TASK SUMMARY* (${formattedDate})\n` +
      `-----------------------------------------\n` +
      `✅ *Tasks Completed Today:* ${completedToday}\n` +
      `⏳ *Active Pending Tasks:* ${pendingTotal}\n` +
      `🚨 *Overdue Tasks:* ${overdueTotal}\n` +
      `📝 *Daily Trackers Logged Today:* ${trackersToday}\n` +
      `⚠️ *Open Escalations:* ${openEscalations}\n` +
      `-----------------------------------------\n` +
      `👉 View detailed dashboard: ${process.env.FRONTEND_URL || 'http://localhost:3000'}`;

    await sendCliqNotification(summaryText);
    console.log('✅ Daily summary dispatched to Zoho Cliq!');
  } catch (err) {
    console.error('Error generating daily summary for Zoho Cliq:', err);
  }
};

const sendDetailedDailyReportToCliq = async () => {
  console.log('🕒 Generating Detailed Brand Status & Pending Tasks Report for Zoho Cliq...');
  try {
    const todayStart = new Date();
    todayStart.setUTCHours(0, 0, 0, 0);

    // 1. Fetch all active clients/brands
    const activeClients = await prisma.client.findMany({
      where: { client_status: 'Active' },
      select: { id: true, company_name: true, brand_name: true }
    });

    // 2. Fetch today's DailyTrackers
    const todayTrackers = await prisma.dailyTracker.findMany({
      where: { date: todayStart }
    });

    // Determine brands with missing updates today
    const updatedClientIds = new Set(todayTrackers.map(t => t.client_id));
    const missingBrandNames = activeClients
      .filter(c => !updatedClientIds.has(c.id))
      .map(c => c.brand_name || c.company_name);

    // 3. Fetch pending & overdue individual tasks
    const pendingTasks = await prisma.task.findMany({
      where: { status: { in: ['Pending', 'In Progress', 'Review'] } },
      include: {
        client: { select: { company_name: true, brand_name: true } },
        assignee: { select: { name: true, email: true } }
      },
      orderBy: { due_date: 'asc' },
      take: 15 // Limit to top 15 tasks to fit in notification
    });

    const formattedDate = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

    let message = `📊 *DAILY OPERATIONS REPORT* • ${formattedDate}\n\n`;

    // Section 1: Brands Status Not Updated Today
    if (missingBrandNames.length === 0) {
      message += `🟢 *ALL BRANDS UPDATED TODAY!*\n\n`;
    } else {
      message += `🔴 *UNUPDATED BRANDS (${missingBrandNames.length})*\n`;
      missingBrandNames.forEach(name => {
        message += `  • ${name}\n`;
      });
      message += `\n`;
    }

    // Section 2: Pending / Overdue Individual Tasks
    if (pendingTasks.length === 0) {
      message += `✨ *NO PENDING TASKS*\n\n`;
    } else {
      const now = new Date();
      message += `⚠️ *PENDING & OVERDUE TASKS (${pendingTasks.length})*\n`;
      pendingTasks.forEach((task, idx) => {
        const brand = task.client?.brand_name || task.client?.company_name || 'General';
        const assignee = task.assignee?.name || 'Unassigned';
        const isOverdue = task.due_date && new Date(task.due_date) < now;
        const statusTag = isOverdue ? '🚨 *OVERDUE*' : `[${task.status}]`;
        const dueDateStr = task.due_date ? new Date(task.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'No due date';

        message += `${idx + 1}. *${task.title}*\n`;
        message += `   └ *Brand:* ${brand}  |  *Owner:* ${assignee}  |  *Due:* ${dueDateStr}  ${statusTag}\n`;
      });
      message += `\n`;
    }

    message += `🔗 *Open Dashboard:* ${process.env.FRONTEND_URL || 'https://rds-db.vercel.app'}`;

    await sendCliqNotification(message);
    console.log('✅ Clean Detailed Daily Report dispatched to Zoho Cliq!');
  } catch (err) {
    console.error('Error generating detailed daily report for Zoho Cliq:', err);
  }
};


const send11AmDailySummaryCheck = async () => {
  console.log('🕒 Running 11:00 AM IST Daily Summary Check & SPOC Tagging...');
  try {
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    const activeClients = await prisma.client.findMany({
      where: { client_status: 'Active' },
      include: {
        spocs: {
          include: {
            user: { select: { id: true, name: true, email: true } }
          }
        },
        daily_trackers: {
          where: { date: today }
        }
      },
      orderBy: { company_name: 'asc' }
    });

    const unupdatedClients = activeClients.filter(c => c.daily_trackers.length === 0);

    if (unupdatedClients.length === 0) {
      const msg = `🟢 *ALL BRANDS UPDATED!* All active client daily summaries have been updated for today (${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}). Excellent work team!`;
      await sendCliqNotification(msg);
      return;
    }

    let cliqMsg = `⚠️ *DAILY SUMMARY NOT UPDATED (11:00 AM IST DEADLINE)*\n`;
    cliqMsg += `=========================================\n`;
    cliqMsg += `The following ${unupdatedClients.length} brand(s) have NOT updated their daily summary today. SPOC Leads, please update immediately!\n\n`;

    const { createNotification } = require('../utils/notificationHelper');

    unupdatedClients.forEach((client, idx) => {
      const brandName = client.brand_name || client.company_name;
      const spocNames = client.spocs.length > 0
        ? client.spocs.map(s => `@${s.user?.name}`).join(', ')
        : 'Unassigned SPOC';

      cliqMsg += `${idx + 1}. 🏢 *${brandName}*\n`;
      cliqMsg += `   └ 👤 *SPOC Lead:* ${spocNames}\n`;
      cliqMsg += `   └ 🚨 *Status:* Daily summary is not updated yet, please update it!\n\n`;

      // Trigger In-App Notification for SPOC users
      client.spocs.forEach(async (spoc) => {
        if (spoc.user?.id) {
          await createNotification(
            `Daily Summary Pending: ${brandName}`,
            `Hi ${spoc.user.name}, the daily summary for ${brandName} is not updated yet for 11:00 AM deadline. Please update it now!`
          );
        }
      });
    });

    cliqMsg += `🔗 *Update Tracker Now:* ${process.env.FRONTEND_URL || 'https://rds-db.vercel.app'}/tracker`;

    await sendCliqNotification(cliqMsg);
    console.log(`✅ 11:00 AM IST Daily summary check complete. Tagged SPOCs for ${unupdatedClients.length} unupdated brands.`);
  } catch (err) {
    console.error('Error running 11:00 AM Daily Summary check:', err);
  }
};

const processScheduledMomDispatches = async () => {
  try {
    const now = new Date();
    const scheduledMeetings = await prisma.meeting.findMany({
      where: {
        is_sent: false,
        scheduled_send_at: { lte: now }
      },
      include: {
        client: { select: { company_name: true, brand_name: true } },
        action_items: { include: { assignee: { select: { name: true, email: true } } } }
      }
    });

    for (const meeting of scheduledMeetings) {
      console.log(`🕒 Dispatching 30-minute scheduled MOM for "${meeting.meeting_title}"...`);
      
      const brandName = meeting.client?.brand_name || meeting.client?.company_name || 'Client';
      
      let cliqMsg = `📝 *SCHEDULED MEETING MINUTES (MOM) DISPATCHED*\n`;
      cliqMsg += `=========================================\n`;
      cliqMsg += `• *Meeting:* "${meeting.meeting_title}"\n`;
      cliqMsg += `• *Brand:* ${brandName}\n`;
      cliqMsg += `• *Date:* ${new Date(meeting.meeting_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}\n`;
      if (meeting.attendees) cliqMsg += `• *Attendees:* ${meeting.attendees}\n`;
      if (meeting.recipient_emails) cliqMsg += `• *Recipients:* ${meeting.recipient_emails}\n`;
      cliqMsg += `\n📌 *KEY DISCUSSION POINTS:*\n${meeting.discussion_points || 'No discussion points logged'}\n\n`;

      if (meeting.action_items.length > 0) {
        cliqMsg += `📋 *ASSIGNED ACTION ITEMS:*\n`;
        meeting.action_items.forEach((item, idx) => {
          const assigneeName = item.assignee?.name ? `@${item.assignee.name}` : 'Unassigned';
          const dueStr = item.deadline ? new Date(item.deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'No due date';
          cliqMsg += `${idx + 1}. *${item.action_item}*\n   └ Owner: ${assigneeName} | Due: ${dueStr}\n`;
        });
      }

      cliqMsg += `\n🔗 *Open Meetings Dashboard:* ${process.env.FRONTEND_URL || 'https://rds-db.vercel.app'}/meetings/${meeting.id}`;
      await sendCliqNotification(cliqMsg);

      if (meeting.recipient_emails) {
        const emails = meeting.recipient_emails.split(',').map(e => e.trim()).filter(Boolean);
        for (const email of emails) {
          await emailService.sendMomEmail(email, meeting);
        }
      }

      await prisma.meeting.update({
        where: { id: meeting.id },
        data: { is_sent: true, sent_at: now }
      });
    }
  } catch (err) {
    console.error('Error processing scheduled MOM dispatches:', err);
  }
};

const sendTaskClosingReminders = async (timeSlotStr) => {
  console.log(`🕒 Running Task Closing Reminder (${timeSlotStr})...`);
  try {
    const activeTasks = await prisma.task.findMany({
      where: { status: { in: ['Pending', 'In Progress', 'Review'] } },
      include: {
        client: { select: { company_name: true, brand_name: true } },
        assignee: { select: { name: true, email: true } }
      },
      orderBy: { due_date: 'asc' }
    });

    let msg = `⏰ *TASK CLOSING & LOGGING REMINDER (${timeSlotStr})*\n`;
    msg += `=========================================\n`;
    msg += `Team, before wrapping up your work for the day, please ensure your active task statuses and daily tracker summaries are updated.\n\n`;

    if (activeTasks.length > 0) {
      msg += `📌 *ACTIVE & OVERDUE TASKS STILL OPEN (${activeTasks.length}):*\n`;
      const now = new Date();
      activeTasks.slice(0, 10).forEach((t, idx) => {
        const brand = t.client?.brand_name || t.client?.company_name || 'General';
        const assignee = t.assignee?.name ? `@${t.assignee.name}` : 'Unassigned';
        const isOverdue = t.due_date && new Date(t.due_date) < now;
        const statusTag = isOverdue ? '🚨 *OVERDUE*' : `[${t.status}]`;

        msg += `${idx + 1}. *${t.title}*\n   └ Brand: ${brand} | Owner: ${assignee} ${statusTag}\n`;
      });
      if (activeTasks.length > 10) {
        msg += `\n...and ${activeTasks.length - 10} more tasks.\n`;
      }
    } else {
      msg += `✨ *GREAT JOB! ALL TASKS ARE COMPLETED FOR TODAY.*\n`;
    }

    msg += `\n🔗 *Update Tasks:* ${process.env.FRONTEND_URL || 'https://rds-db.vercel.app'}/tasks`;
    msg += `\n🔗 *Update Daily Tracker:* ${process.env.FRONTEND_URL || 'https://rds-db.vercel.app'}/tracker`;

    await sendCliqNotification(msg);
    return true;
  } catch (err) {
    console.error('Error sending task closing reminders:', err);
    return false;
  }
};

module.exports = {
  startCronJobs,
  sendWeeklyReportsNow,
  generateReportHtmlForClient,
  sendDailyTaskSummaryToCliq,
  sendDetailedDailyReportToCliq,
  send11AmDailySummaryCheck,
  sendTaskClosingReminders,
  processScheduledMomDispatches
};


