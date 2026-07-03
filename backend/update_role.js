require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  const role = await prisma.role.findFirst({where: {role_name: 'Team Member'}});
  if (!role) {
    console.log('Role not found');
    return;
  }
  try {
    await prisma.user.update({
      where: {email: 'bhumi.vishnukanth@rdsdigital.in'},
      data: {role_id: role.id}
    });
    console.log('User updated successfully to Team Member.');
  } catch (err) {
    console.log('Failed to update user:', err.message);
  }
}
run().catch(console.error).finally(() => prisma.$disconnect());
