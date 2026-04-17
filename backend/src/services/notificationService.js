const Notification = require('../models/Notification');
const { getIO } = require('../sockets/socketState');

async function emitUnreadCount(io, userId) {
	const unreadCount = await Notification.countDocuments({ userId, isRead: false });
	io.to(`room:user:${String(userId)}`).emit('notification:unread_count', {
		unreadCount
	});
	return unreadCount;
}

async function createNotification({ userId, type, title, body, metadata }) {
	const notification = await Notification.create({
		userId,
		type,
		title,
		body,
		metadata,
		isRead: false
	});

	const io = getIO();
	if (io) {
		io.to(`room:user:${String(userId)}`).emit('notification:new', notification);
		await emitUnreadCount(io, userId);
	}

	return notification;
}

async function markNotificationRead({ userId, notificationId }) {
	const notification = await Notification.findOneAndUpdate(
		{ _id: notificationId, userId },
		{ $set: { isRead: true } },
		{ new: true }
	);

	if (notification) {
		const io = getIO();
		if (io) {
			io.to(`room:user:${String(userId)}`).emit('notification:read', {
				notificationId: String(notification._id)
			});
			await emitUnreadCount(io, userId);
		}
	}

	return notification;
}

async function markAllNotificationsRead({ userId }) {
	await Notification.updateMany({ userId, isRead: false }, { $set: { isRead: true } });

	const io = getIO();
	if (io) {
		io.to(`room:user:${String(userId)}`).emit('notification:read_all', {
			userId: String(userId)
		});
		await emitUnreadCount(io, userId);
	}
}

async function listNotifications({ userId, since, limit = 20 }) {
	const query = { userId };
	const sinceDate = since ? new Date(since) : null;

	if (sinceDate && !Number.isNaN(sinceDate.getTime())) {
		query.createdAt = { $gt: sinceDate };
	}

	const notifications = await Notification.find(query)
		.sort({ createdAt: -1 })
		.limit(Math.min(Math.max(Number(limit) || 20, 1), 100))
		.lean();

	const unreadCount = await Notification.countDocuments({ userId, isRead: false });

	return {
		notifications,
		unreadCount
	};
}

module.exports = {
	createNotification,
	markNotificationRead,
	markAllNotificationsRead,
	listNotifications
};
