const mongoose = require('mongoose');

const {
	markNotificationRead,
	markAllNotificationsRead,
	listNotifications
} = require('../services/notificationService');

function isObjectId(value) {
	return mongoose.Types.ObjectId.isValid(String(value || ''));
}

function socketError(socket, event, message) {
	socket.emit(event, { success: false, message });
}

module.exports = function notificationHandler(io) {
	io.on('connection', (socket) => {
		const userId = socket.data?.user?.id;

		if (!userId || !isObjectId(userId)) {
			socket.disconnect(true);
			return;
		}

		socket.join(`room:user:${String(userId)}`);

		socket.on('notification:read', async ({ notificationId } = {}) => {
			try {
				if (!notificationId || !isObjectId(notificationId)) {
					socketError(socket, 'notification:error', 'Valid notificationId is required');
					return;
				}

				await markNotificationRead({
					userId: String(userId),
					notificationId: String(notificationId)
				});
			} catch (error) {
				console.error('[socket:notification] mark read failed:', error.message);
				socketError(socket, 'notification:error', 'Failed to mark notification as read');
			}
		});

		socket.on('notification:read_all', async () => {
			try {
				await markAllNotificationsRead({ userId: String(userId) });
			} catch (error) {
				console.error('[socket:notification] mark all read failed:', error.message);
				socketError(socket, 'notification:error', 'Failed to mark all notifications as read');
			}
		});

		socket.on('notification:sync', async ({ since, limit = 20 } = {}) => {
			try {
				const result = await listNotifications({
					userId: String(userId),
					since,
					limit
				});

				socket.emit('notification:sync', {
					notifications: result.notifications,
					unreadCount: result.unreadCount,
					since: since || null,
					serverTime: new Date().toISOString()
				});
			} catch (error) {
				console.error('[socket:notification] sync failed:', error.message);
				socketError(socket, 'notification:error', 'Failed to sync notifications');
			}
		});

		socket.on('notification:list', async ({ limit = 20 } = {}) => {
			try {
				const result = await listNotifications({
					userId: String(userId),
					limit
				});

				socket.emit('notification:list', {
					notifications: result.notifications,
					unreadCount: result.unreadCount,
					serverTime: new Date().toISOString()
				});
			} catch (error) {
				console.error('[socket:notification] list failed:', error.message);
				socketError(socket, 'notification:error', 'Failed to list notifications');
			}
		});

		socket.emit('notification:sync:required', {
			reason: socket.recovered ? 'recovered_connection' : 'fresh_connection'
		});
	});
};
