const mongoose = require('mongoose');

const Notification = require('../models/Notification');
const { markNotificationRead } = require('../services/notificationService');

module.exports = function notificationHandler(io) {
	io.on('connection', (socket) => {
		const userId = socket.handshake.auth?.userId || socket.handshake.query?.userId;

		if (userId && mongoose.Types.ObjectId.isValid(String(userId))) {
			socket.join(`room:user:${String(userId)}`);
		}

		socket.on('notification:join', ({ userId: joinUserId }) => {
			if (!joinUserId || !mongoose.Types.ObjectId.isValid(String(joinUserId))) {
				return;
			}

			socket.join(`room:user:${String(joinUserId)}`);
		});

		socket.on('notification:read', async ({ notificationId, userId: payloadUserId }) => {
			try {
				const resolvedUserId = payloadUserId || userId;
				if (
					!resolvedUserId ||
					!notificationId ||
					!mongoose.Types.ObjectId.isValid(String(resolvedUserId)) ||
					!mongoose.Types.ObjectId.isValid(String(notificationId))
				) {
					return;
				}

				await markNotificationRead({
					userId: String(resolvedUserId),
					notificationId: String(notificationId)
				});
			} catch (error) {
				console.error('[socket:notification] mark read failed:', error.message);
			}
		});

		socket.on('notification:list', async ({ userId: payloadUserId, limit = 20 } = {}) => {
			try {
				const resolvedUserId = payloadUserId || userId;
				if (!resolvedUserId || !mongoose.Types.ObjectId.isValid(String(resolvedUserId))) {
					return;
				}

				const notifications = await Notification.find({ userId: resolvedUserId })
					.sort({ createdAt: -1 })
					.limit(Math.min(Number(limit) || 20, 100))
					.lean();

				socket.emit('notification:list', notifications);
			} catch (error) {
				console.error('[socket:notification] list failed:', error.message);
			}
		});
	});
};
