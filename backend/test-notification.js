const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function createTestNotification() {
  try {
    const user = await prisma.user.findFirst();
    if (!user) {
      console.log('No user found to send notification to.');
      return;
    }

    const notification = await prisma.notification.create({
      data: {
        user_id: user.id,
        title: 'Test Notification',
        message: 'This is a test notification to check the sound!',
        is_read: false
      }
    });

    console.log('✅ Successfully created test notification!');
    console.log(notification);
  } catch (error) {
    console.error('Error creating notification:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createTestNotification();
