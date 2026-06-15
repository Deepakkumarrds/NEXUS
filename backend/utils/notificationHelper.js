const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * Helper to generate a notification
 * @param {string} title 
 * @param {string} message 
 */
exports.createNotification = async (title, message) => {
  try {
    // For now, assigning to the first user (Admin)
    let user = await prisma.user.findFirst();
    if (user) {
      await prisma.notification.create({
        data: {
          user_id: user.id,
          title,
          message
        }
      });
    }
  } catch (error) {
    console.error('Failed to create notification:', error);
  }
};
