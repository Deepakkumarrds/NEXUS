const { PrismaClient } = require('./node_modules/@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  // Find all attendances for today
  const attendances = await prisma.attendance.findMany({
    where: { date: today },
    include: { status_logs: { orderBy: { start_time: 'asc' } } }
  });

  for (const attendance of attendances) {
    const logs = attendance.status_logs;
    const openLogs = logs.filter(l => l.end_time === null);
    
    // If there's more than one open log, close the older ones
    if (openLogs.length > 1) {
      // Sort open logs by start_time descending (newest first)
      openLogs.sort((a, b) => b.start_time - a.start_time);
      
      // Keep the newest one open, close the rest
      const logsToClose = openLogs.slice(1);
      
      for (const log of logsToClose) {
        await prisma.statusLog.update({
          where: { id: log.id },
          data: { 
            end_time: log.start_time,
            duration_minutes: 0 
          }
        });
        console.log(`Closed duplicate log ${log.id} (${log.status})`);
      }
    }
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
