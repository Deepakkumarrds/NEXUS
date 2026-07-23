const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { sendCliqNotification } = require('./cliqService');

/**
 * SOW Breach Predictor Service
 * Monitors completed tasks vs committed SOW deliverables for the current month.
 */
async function checkSowBreaches() {
  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    // Fetch all active SOW Items with their client and completed tasks for current month
    const sowItems = await prisma.sowItem.findMany({
      include: {
        sow: {
          include: {
            client: { select: { company_name: true, brand_name: true } }
          }
        },
        tasks: {
          where: {
            status: 'Completed',
            completed_at: {
              gte: startOfMonth,
              lte: endOfMonth
            }
          }
        }
      }
    });

    const warningBreaches = [];
    const criticalBreaches = [];

    sowItems.forEach(item => {
      const clientName = item.sow?.client?.brand_name || item.sow?.client?.company_name || 'Client';
      const deliverableName = item.deliverable_name || 'Deliverable';
      const committedQty = item.committed_qty || 1;
      const completedCount = item.tasks ? item.tasks.length : 0;
      const usagePercentage = Math.round((completedCount / committedQty) * 100);

      if (completedCount > committedQty) {
        criticalBreaches.push({
          clientName,
          deliverableName,
          committedQty,
          completedCount,
          usagePercentage,
          overage: completedCount - committedQty
        });
      } else if (usagePercentage >= 80) {
        warningBreaches.push({
          clientName,
          deliverableName,
          committedQty,
          completedCount,
          usagePercentage,
          remaining: committedQty - completedCount
        });
      }
    });

    // Send Cliq notifications if any breaches exist
    if (criticalBreaches.length > 0 || warningBreaches.length > 0) {
      let notificationText = `🛡️ *SOW BREACH PREDICTOR REPORT*\n=========================================\n\n`;

      if (criticalBreaches.length > 0) {
        notificationText += `🚨 *CRITICAL SOW EXCEEDED (${criticalBreaches.length}):*\n`;
        criticalBreaches.forEach(item => {
          notificationText += `• *${item.clientName}* — ${item.deliverableName}\n`;
          notificationText += `   └ *Usage:* ${item.completedCount} / ${item.committedQty} (${item.usagePercentage}%) | ⚠️ *Exceeded by +${item.overage}*\n`;
        });
        notificationText += `\n`;
      }

      if (warningBreaches.length > 0) {
        notificationText += `⚠️ *APPROACHING SCOPE LIMIT (${warningBreaches.length}):*\n`;
        warningBreaches.forEach(item => {
          notificationText += `• *${item.clientName}* — ${item.deliverableName}\n`;
          notificationText += `   └ *Usage:* ${item.completedCount} / ${item.committedQty} (${item.usagePercentage}%) | ${item.remaining} remaining\n`;
        });
        notificationText += `\n`;
      }

      notificationText += `🔗 *Open SOW Dashboard:* ${process.env.FRONTEND_URL || 'https://rds-db.vercel.app'}/sow`;

      await sendCliqNotification({ text: notificationText });
    }

    return { warningBreaches, criticalBreaches };
  } catch (error) {
    console.error('Error in checkSowBreaches:', error);
    throw error;
  }
}

/**
 * Format SOW Breach report for interactive Zoho Cliq queries
 */
async function getSowBreachReport() {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

  const sowItems = await prisma.sowItem.findMany({
    include: {
      sow: {
        include: {
          client: { select: { company_name: true, brand_name: true } }
        }
      },
      tasks: {
        where: {
          status: 'Completed',
          completed_at: {
            gte: startOfMonth,
            lte: endOfMonth
          }
        }
      }
    }
  });

  if (sowItems.length === 0) {
    return `🛡️ *SOW BREACH REPORT:* No active SOW deliverables defined in database yet.\n\n🔗 *Create SOW:* ${process.env.FRONTEND_URL || 'https://rds-db.vercel.app'}/sow`;
  }

  let reply = `🛡️ *CURRENT MONTH SOW SCOPE TRACKER*\n=========================================\n\n`;

  sowItems.forEach((item, idx) => {
    const clientName = item.sow?.client?.brand_name || item.sow?.client?.company_name || 'Client';
    const deliverableName = item.deliverable_name || 'Deliverable';
    const committedQty = item.committed_qty || 1;
    const completedCount = item.tasks ? item.tasks.length : 0;
    const usagePercentage = Math.round((completedCount / committedQty) * 100);

    let statusTag = '🟢 [In Scope]';
    if (completedCount > committedQty) {
      statusTag = '🚨 *[SOW EXCEEDED]*';
    } else if (usagePercentage >= 80) {
      statusTag = '⚠️ *[APPROACHING LIMIT]*';
    }

    reply += `${idx + 1}. *${clientName}* — ${deliverableName}\n`;
    reply += `   └ *Completed:* ${completedCount} / ${committedQty} (${usagePercentage}%) ${statusTag}\n\n`;
  });

  reply += `🔗 *Open SOW Manager:* ${process.env.FRONTEND_URL || 'https://rds-db.vercel.app'}/sow`;
  return reply;
}

module.exports = {
  checkSowBreaches,
  getSowBreachReport
};
