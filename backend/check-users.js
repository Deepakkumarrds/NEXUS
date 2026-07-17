const { PrismaClient } = require('./node_modules/@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany({ select: { email: true } });
  const clients = await prisma.clientUser.findMany({ select: { email: true } });
  
  console.log('--- ADMIN USERS ---');
  users.forEach(u => console.log(u.email));
  
  console.log('\n--- CLIENT USERS ---');
  clients.forEach(c => console.log(c.email));
}

main().catch(console.error).finally(() => prisma.$disconnect());
