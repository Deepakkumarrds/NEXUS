const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const users = await prisma.user.findMany();
  console.log('Users in DB:', users.length);
  const clients = await prisma.client.findMany();
  console.log('Clients in DB:', clients.length);
}
main().catch(e => console.error(e)).finally(() => prisma.$disconnect());
