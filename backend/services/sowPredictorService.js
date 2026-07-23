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
 * Format SOW Scope & Deliverable Comparison report for interactive Zoho Cliq queries
 */
async function getSowBreachReport(clientQuery = null) {
  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    // Clean up stop words from clientQuery (e.g. "for indian academy" -> "indian academy")
    let cleanBrand = '';
    if (clientQuery && typeof clientQuery === 'string') {
      cleanBrand = clientQuery
        .replace(/\b(for|of|the|about|status|sow|report|breach|alert|details)\b/gi, '')
        .trim();
    }

    const normalize = (str) => (str || '').toLowerCase().replace(/[^a-z0-9]/g, '');
    const targetNorm = normalize(cleanBrand);

    const allSows = await prisma.sow.findMany({
      include: {
        client: { select: { company_name: true, brand_name: true } },
        months: {
          include: {
            items: {
              include: {
                tasks: true
              }
            }
          }
        }
      },
      orderBy: { created_at: 'desc' }
    });

    let sows = allSows;
    if (targetNorm && targetNorm.length > 0) {
      sows = allSows.filter(sow => {
        const compNorm = normalize(sow.client?.company_name);
        const brandNorm = normalize(sow.client?.brand_name);
        const sowNameNorm = normalize(sow.sow_name);
        return compNorm.includes(targetNorm) || targetNorm.includes(compNorm) ||
               (brandNorm && (brandNorm.includes(targetNorm) || targetNorm.includes(brandNorm))) ||
               sowNameNorm.includes(targetNorm);
      });
    }

    if (sows.length === 0) {
      return `🛡️ *SOW SCOPE REPORT:* No SOW contracts found ${cleanBrand ? `matching "${cleanBrand}"` : 'in database'}.\n\n🔗 *Manage SOWs:* ${process.env.FRONTEND_URL || 'https://rds-db.vercel.app'}/sows`;
    }

  let reply = `🛡️ *SOW SCOPE & DELIVERABLES COMPARISON REPORT*\n=========================================\n\n`;

  sows.forEach((sow, sowIdx) => {
    const brand = sow.client?.brand_name || sow.client?.company_name || 'Client';
    const totalValStr = sow.total_value ? `₹ ${Number(sow.total_value).toLocaleString('en-IN')}` : '₹ 0';
    const startDateStr = sow.start_date ? new Date(sow.start_date).toLocaleDateString('en-IN') : 'N/A';
    const endDateStr = sow.end_date ? new Date(sow.end_date).toLocaleDateString('en-IN') : 'N/A';

    reply += `🏢 *Client:* ${brand}\n`;
    reply += `📋 *SOW Name:* ${sow.sow_name}\n`;
    reply += `• *Status:* ${sow.status}\n`;
    reply += `• *Contract Period:* ${startDateStr} to ${endDateStr}\n`;
    reply += `• *Total Value:* ${totalValStr}\n\n`;

    let totalDefined = 0;
    let totalDelivered = 0;
    const itemSummaries = [];

    if (sow.months && sow.months.length > 0) {
      sow.months.forEach(m => {
        if (m.items) {
          m.items.forEach(item => {
            const defined = item.committed_qty || 1;
            const delivered = item.tasks ? item.tasks.filter(t => t.status === 'Completed').length : 0;
            const pending = Math.max(0, defined - delivered);
            totalDefined += defined;
            totalDelivered += delivered;

            let tag = '🟢 In Scope';
            if (delivered > defined) tag = '🚨 SOW Exceeded';
            else if (defined > 0 && (delivered / defined) >= 0.8) tag = '⚠️ Approaching Limit';

            itemSummaries.push({
              name: item.deliverable_name,
              defined,
              delivered,
              pending,
              tag
            });
          });
        }
      });
    }

    reply += `📊 *MONTHLY COMPARISON SUMMARY:*\n`;
    reply += `  └ *1. Defined Scope:* ${totalDefined} items\n`;
    reply += `  └ *2. Delivered (Completed):* ${totalDelivered} items\n`;
    reply += `  └ *3. Pending / Active:* ${Math.max(0, totalDefined - totalDelivered)} items\n\n`;

    if (itemSummaries.length > 0) {
      reply += `📝 *DELIVERABLE QUOTA BREAKDOWN:*\n`;
      itemSummaries.forEach((item, idx) => {
        reply += `${idx + 1}. *${item.name}*\n`;
        reply += `   └ Defined: ${item.defined} | Delivered: ${item.delivered} | Pending: ${item.pending} [${item.tag}]\n`;
      });
    }

    if (sowIdx < sows.length - 1) {
      reply += `\n-----------------------------------------\n\n`;
    }
  });

  reply += `\n🔗 *Open SOW Dashboard:* ${process.env.FRONTEND_URL || 'https://rds-db.vercel.app'}/sows`;
  return reply;
  } catch (error) {
    console.error('Error generating SOW breach report:', error);
    return `🛡️ *SOW SCOPE REPORT:* Failed to generate SOW report. Please try again.`;
  }
}

module.exports = {
  checkSowBreaches,
  getSowBreachReport
};
