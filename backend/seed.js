const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const prisma = new PrismaClient();

async function seed() {
  try {
    let role = await prisma.role.findUnique({ where: { role_name: 'Admin' } });
    if (!role) {
      role = await prisma.role.create({
        data: { role_name: 'Admin', description: 'System Administrator' }
      });
    }

    const email = 'admin@example.com';
    let admin = await prisma.user.findUnique({ where: { email } });
    if (!admin) {
      const password_hash = await bcrypt.hash('admin123', 10);
      admin = await prisma.user.create({
        data: {
          name: 'Admin User',
          email,
          password_hash,
          role_id: role.id,
          status: 'Active'
        }
      });
      console.log('Admin user created: admin@example.com / admin123');
    } else {
      console.log('Admin user already exists.');
    }
  } catch(err) {
    console.error('Seed error:', err);
  } finally {
    await prisma.$disconnect();
  }
}
seed();
