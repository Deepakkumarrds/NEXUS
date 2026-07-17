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
      const notification = await prisma.notification.create({
        data: {
          user_id: user.id,
          title,
          message
        }
      });
      if (global.io) {
        global.io.emit('new_notification', notification);
      }
    }
  } catch (error) {
    console.error('Failed to create notification:', error);
  }
};
