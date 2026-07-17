const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

exports.getNotifications = async (req, res) => {
  try {
    // In a real app, this would use req.user.id from auth middleware
    let user = await prisma.user.findFirst();
    if (!user) return res.status(404).json({ status: 'error', message: 'No user found' });

    const notifications = await prisma.notification.findMany({
      where: { user_id: user.id },
      orderBy: { created_at: 'desc' },
      take: 50 // Limit to last 50 for performance
    });

    res.status(200).json({ status: 'success', data: notifications });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ status: 'error', message: 'Failed to fetch notifications' });
  }
};

exports.markAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    
    const notification = await prisma.notification.update({
      where: { id },
      data: { is_read: true }
    });

    res.status(200).json({ status: 'success', data: notification });
  } catch (error) {
    console.error('Error marking notification read:', error);
    res.status(500).json({ status: 'error', message: 'Failed to update notification' });
  }
};

exports.markAllAsRead = async (req, res) => {
  try {
    let user = await prisma.user.findFirst();
    
    await prisma.notification.updateMany({
      where: { user_id: user.id, is_read: false },
      data: { is_read: true }
    });

    res.status(200).json({ status: 'success', message: 'All notifications marked as read' });
  } catch (error) {
    console.error('Error marking all read:', error);
    res.status(500).json({ status: 'error', message: 'Failed to update notifications' });
  }
};

exports.createTestNotification = async (req, res) => {
  try {
    let user = await prisma.user.findFirst();
    if (!user) return res.status(404).json({ status: 'error', message: 'No user found' });

    const notification = await prisma.notification.create({
      data: {
        user_id: user.id,
        title: 'Real-Time Notification',
        message: 'This notification was pushed instantly via Socket.io!',
        is_read: false
      }
    });

    if (global.io) {
      global.io.emit('new_notification', notification);
    }

    res.status(200).json({ status: 'success', data: notification });
  } catch (error) {
    console.error('Error creating test notification:', error);
    res.status(500).json({ status: 'error', message: 'Failed to create test notification' });
  }
};
