const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany();
  console.log('Users:', users.map(u => u.email));
  const clientUsers = await prisma.clientUser.findMany();
  console.log('Client Users:', clientUsers.map(u => u.email));
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
