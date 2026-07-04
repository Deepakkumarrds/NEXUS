const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const prisma = new PrismaClient();

async function resetPasswords() {
  try {
    const hashedPassword = await bcrypt.hash('password@123', 10);
    
    // Find the Team Member role
    const role = await prisma.role.findFirst({
      where: { role_name: 'Team Member' }
    });

    if (role) {
      const result = await prisma.user.updateMany({
        where: { role_id: role.id },
        data: { password_hash: hashedPassword }
      });
      console.log(`Successfully reset passwords for ${result.count} team members to 'password@123'`);
    } else {
      console.log('Role "Team Member" not found.');
    }
  } catch (e) {
    console.error(e);
  } finally {
    await prisma.$disconnect();
  }
}

resetPasswords();
