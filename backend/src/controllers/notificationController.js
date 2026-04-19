const Notification = require('../models/Notification');
const {
  listNotifications,
  markNotificationRead,
  markAllNotificationsRead
} = require('../services/notificationService');

async function getMyNotifications(req, res, next) {
  try {
    const userId = req.user.id;
    const { since, limit } = req.query;

    const result = await listNotifications({ userId, since, limit });

    res.json({
      success: true,
      data: {
        notifications: result.notifications,
        unreadCount: result.unreadCount
      }
    });
  } catch (error) {
    next(error);
  }
}

async function getMyUnreadCount(req, res, next) {
  try {
    const userId = req.user.id;
    const unreadCount = await Notification.countDocuments({ userId, isRead: false });

    res.json({
      success: true,
      data: { unreadCount }
    });
  } catch (error) {
    next(error);
  }
}

async function markMyNotificationRead(req, res, next) {
  try {
    const userId = req.user.id;
    const { notificationId } = req.params;

    const notification = await markNotificationRead({ userId, notificationId });
    if (!notification) {
      const error = new Error('Notification not found');
      error.statusCode = 404;
      throw error;
    }

    res.json({
      success: true,
      message: 'Notification marked as read'
    });
  } catch (error) {
    next(error);
  }
}

async function markAllMyNotificationsRead(req, res, next) {
  try {
    const userId = req.user.id;
    await markAllNotificationsRead({ userId });

    res.json({
      success: true,
      message: 'All notifications marked as read'
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getMyNotifications,
  getMyUnreadCount,
  markMyNotificationRead,
  markAllMyNotificationsRead
};
