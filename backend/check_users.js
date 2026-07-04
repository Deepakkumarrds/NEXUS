const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const users = await prisma.user.findMany({ include: { role: true } });
  users.forEach(u => console.log(`Email: ${u.email} | Role: ${u.role ? u.role.role_name : 'None'}`));
}
main().catch(e => console.error(e)).finally(() => prisma.$disconnect());
