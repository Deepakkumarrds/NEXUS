const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Seeding Roles...');

  const roles = [
    { role_name: 'Admin', description: 'Full access to the platform' },
    { role_name: 'Team Member', description: 'Can view and update tasks, MOM, and SOW' }
  ];

  for (const role of roles) {
    await prisma.role.upsert({
      where: { role_name: role.role_name },
      update: {},
      create: role,
    });
  }

  console.log('Roles seeded successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
