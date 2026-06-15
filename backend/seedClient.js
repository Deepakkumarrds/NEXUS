const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const prisma = new PrismaClient();

async function main() {
  console.log('Seeding a dummy client and client user...');

  // Fetch first client
  let client = await prisma.client.findFirst();

  if (!client) {
    console.log('No clients found in the database. Please create a client in the admin dashboard first.');
    return;
  }
  
  console.log(`Using Client: ${client.company_name}`);

  // Create a ClientUser
  const clientEmail = 'client@acmecorp.com';
  let clientUser = await prisma.clientUser.findUnique({
    where: { email: clientEmail }
  });

  if (!clientUser) {
    const hashedPassword = await bcrypt.hash('client123', 10);
    clientUser = await prisma.clientUser.create({
      data: {
        client_id: client.id,
        name: 'Jane Smith (Client Rep)',
        email: clientEmail,
        password_hash: hashedPassword,
        status: 'Active'
      }
    });
    console.log(`Created ClientUser: ${clientEmail} (Password: client123)`);
  } else {
    console.log(`ClientUser already exists: ${clientEmail} (Password: client123)`);
  }
}

main()
  .catch((e) => console.error(e))
  .finally(() => prisma.$disconnect());
