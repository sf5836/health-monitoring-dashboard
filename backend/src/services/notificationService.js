const Notification = require('../models/Notification');
const { getIO } = require('../sockets/socketState');

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
		}
	}

	return notification;
}

module.exports = {
	createNotification,
	markNotificationRead
};
