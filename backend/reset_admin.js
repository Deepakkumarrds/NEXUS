require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const prisma = new PrismaClient();

async function run() {
  try {
    const hashedPassword = await bcrypt.hash('admin123', 10);
    
    // Update admin@example.com
    await prisma.user.updateMany({
      where: { email: 'admin@example.com' },
      data: { password_hash: hashedPassword }
    });
    console.log('Reset admin@example.com password to admin123');

    // Update admin@agency.com
    await prisma.user.updateMany({
      where: { email: 'admin@agency.com' },
      data: { password_hash: hashedPassword }
    });
    console.log('Reset admin@agency.com password to admin123');
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}
run();
