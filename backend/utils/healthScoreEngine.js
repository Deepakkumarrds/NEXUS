const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * Calculates and updates the Client Health Score
 * @param {string} clientId
 */
async function calculateClientHealth(clientId) {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const client = await prisma.client.findUnique({
      where: { id: clientId },
      include: {
        tasks: true,
        communications: {
          where: { created_at: { gte: thirtyDaysAgo } }
        },
        escalations: {
          where: { status: { not: 'Resolved' } }
        }
      }
    });

    if (!client) return null;

    // 1. Task Completion Rate Score (max 30 points)
    let taskScore = 30;
    const totalTasks = client.tasks.length;
    if (totalTasks > 0) {
      const completedTasks = client.tasks.filter(t => t.status === 'Completed').length;
      const delayedTasks = client.tasks.filter(t => t.status === 'Delayed').length;
      // Formula: base 30 * (completed / total) - (delayed penalty)
      taskScore = Math.max(0, Math.round((30 * (completedTasks / totalTasks)) - (delayedTasks * 2)));
    }

    // 2. Escalation Score (max 40 points)
    let escalationScore = 40;
    const openEscalations = client.escalations.length;
    const criticalEscalations = client.escalations.filter(e => e.severity === 'Critical').length;
    
    if (criticalEscalations > 0) {
      escalationScore = 0; // Immediate drop if there are open critical escalations
    } else {
      escalationScore = Math.max(0, 40 - (openEscalations * 10));
    }

    // 3. Communication Frequency Score (max 30 points)
    let communicationScore = 0;
    const commsCount = client.communications.length;
    if (commsCount >= 4) {
      communicationScore = 30; // Excellent communication
    } else if (commsCount >= 2) {
      communicationScore = 20; // Acceptable
    } else if (commsCount === 1) {
      communicationScore = 10; // Warning
    } else {
      communicationScore = 0; // No comms in 30 days
    }

    const overallScore = taskScore + escalationScore + communicationScore;
    
    // Determine Risk Level
    let riskLevel = 'Stable';
    if (overallScore >= 90) riskLevel = 'Excellent';
    else if (overallScore >= 70) riskLevel = 'Stable';
    else if (overallScore >= 50) riskLevel = 'Risk';
    else riskLevel = 'Critical';

    // Create a new health score record
    const healthScoreRecord = await prisma.clientHealthScore.create({
      data: {
        client_id: clientId,
        communication_score: communicationScore,
        task_completion_score: taskScore,
        escalation_score: escalationScore,
        report_timeliness_score: 0, // Placeholder
        overall_score: overallScore,
        risk_level: riskLevel
      }
    });

    return healthScoreRecord;
  } catch (error) {
    console.error('Error calculating health score:', error);
    return null;
  }
}

module.exports = { calculateClientHealth };
