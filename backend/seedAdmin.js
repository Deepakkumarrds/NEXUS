const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const prisma = new PrismaClient();

async function main() {
  console.log('Seeding initial Admin role and user...');

  // Check if Admin role exists
  let adminRole = await prisma.role.findUnique({
    where: { role_name: 'Admin' }
  });

  if (!adminRole) {
    adminRole = await prisma.role.create({
      data: {
        role_name: 'Admin',
        description: 'Super Administrator with full access'
      }
    });
    console.log('Created Admin Role.');
  } else {
    console.log('Admin role already exists.');
  }

  // Check if Admin user exists
  const adminEmail = 'admin@agency.com';
  let adminUser = await prisma.user.findUnique({
    where: { email: adminEmail }
  });

  if (!adminUser) {
    const hashedPassword = await bcrypt.hash('admin123', 10);
    adminUser = await prisma.user.create({
      data: {
        name: 'System Admin',
        email: adminEmail,
        password_hash: hashedPassword,
        role_id: adminRole.id,
        department: 'Management',
        designation: 'CEO',
        status: 'Active'
      }
    });
    console.log('Created Admin User: admin@agency.com (Password: admin123)');
  } else {
    console.log('Admin user already exists.');
  }

  console.log('Seeding completed successfully.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
