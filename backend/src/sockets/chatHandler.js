const mongoose = require('mongoose');

const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const { createNotification } = require('../services/notificationService');

function isObjectId(value) {
	return mongoose.Types.ObjectId.isValid(String(value || ''));
}

function socketError(socket, event, message) {
	socket.emit(event, { success: false, message });
}

async function resolveConversation({ senderId, conversationId, toUserId }) {
	if (conversationId && isObjectId(conversationId)) {
		const existing = await Conversation.findOne({
			_id: conversationId,
			participantIds: senderId
		});

		if (!existing) {
			const error = new Error('Conversation not found');
			error.statusCode = 404;
			throw error;
		}

		return existing;
	}

	if (!toUserId || !isObjectId(toUserId) || String(toUserId) === String(senderId)) {
		const error = new Error('conversationId or a valid toUserId is required');
		error.statusCode = 400;
		throw error;
	}

	let conversation = await Conversation.findOne({
		participantIds: { $all: [senderId, toUserId] }
	});

	if (!conversation) {
		conversation = await Conversation.create({
			participantIds: [senderId, toUserId],
			lastMessageAt: new Date()
		});
	}

	return conversation;
}

async function emitConversationSnapshot(io, conversation) {
	const summary = {
		_id: String(conversation._id),
		participantIds: conversation.participantIds.map((id) => String(id)),
		lastMessageAt: conversation.lastMessageAt,
		updatedAt: conversation.updatedAt
	};

	for (const participantId of summary.participantIds) {
		io.to(`room:user:${participantId}`).emit('chat:conversation:updated', summary);
	}
}

module.exports = function chatHandler(io) {
	io.on('connection', (socket) => {
		const userId = socket.data?.user?.id;

		if (!userId || !isObjectId(userId)) {
			socket.disconnect(true);
			return;
		}

		socket.join(`room:user:${String(userId)}`);

		socket.emit('socket:ready', {
			userId: String(userId),
			serverTime: new Date().toISOString(),
			recovered: Boolean(socket.recovered)
		});

		socket.on('chat:joinConversation', async ({ conversationId } = {}) => {
			try {
				if (!conversationId || !isObjectId(conversationId)) {
					socketError(socket, 'chat:error', 'Valid conversationId is required');
					return;
				}

				const conversation = await Conversation.findOne({
					_id: conversationId,
					participantIds: userId
				})
					.select('_id')
					.lean();

				if (!conversation) {
					socketError(socket, 'chat:error', 'Conversation not found');
					return;
				}

				socket.join(`room:conversation:${String(conversationId)}`);
				socket.emit('chat:conversation:joined', { conversationId: String(conversationId) });
			} catch (error) {
				console.error('[socket:chat] join failed:', error.message);
				socketError(socket, 'chat:error', 'Failed to join conversation');
			}
		});

		socket.on('chat:message:send', async (payload = {}) => {
			try {
				const { conversationId, toUserId, text, fileUrl, messageType } = payload;

				if (!text && !fileUrl) {
					socketError(socket, 'chat:error', 'Either text or fileUrl is required');
					return;
				}

				const conversation = await resolveConversation({
					senderId: userId,
					conversationId,
					toUserId
				});

				const message = await Message.create({
					conversationId: conversation._id,
					senderId: userId,
					messageType: messageType || (fileUrl ? 'file' : 'text'),
					text,
					fileUrl,
					readBy: [userId]
				});

				conversation.lastMessageAt = new Date();
				await conversation.save();

				const messagePayload = {
					conversationId: String(conversation._id),
					message
				};

				socket.join(`room:conversation:${String(conversation._id)}`);
				io.to(`room:conversation:${String(conversation._id)}`).emit('chat:message:new', messagePayload);

				conversation.participantIds.forEach((participantId) => {
					io.to(`room:user:${String(participantId)}`).emit('chat:message:new', messagePayload);
				});

				await emitConversationSnapshot(io, conversation);

				const recipientIds = conversation.participantIds
					.map((participantId) => String(participantId))
					.filter((participantId) => participantId !== String(userId));

				await Promise.all(
					recipientIds.map((recipientId) =>
						createNotification({
							userId: recipientId,
							type: 'chat',
							title: 'New Message',
							body: text ? String(text).slice(0, 120) : 'You received a new file message.',
							metadata: {
								conversationId: String(conversation._id),
								messageId: String(message._id)
							}
						})
					)
				);
			} catch (error) {
				console.error('[socket:chat] message send failed:', error.message);
				socketError(socket, 'chat:error', 'Failed to send message');
			}
		});

		socket.on('chat:message:read', async ({ messageId, conversationId } = {}) => {
			try {
				if (!messageId && !conversationId) {
					socketError(socket, 'chat:error', 'messageId or conversationId is required');
					return;
				}

				if (messageId) {
					if (!isObjectId(messageId)) {
						socketError(socket, 'chat:error', 'Invalid messageId');
						return;
					}

					const message = await Message.findById(messageId);
					if (!message) {
						return;
					}

					const memberConversation = await Conversation.findOne({
						_id: message.conversationId,
						participantIds: userId
					})
						.select('_id')
						.lean();

					if (!memberConversation) {
						socketError(socket, 'chat:error', 'Conversation not found');
						return;
					}

					await Message.updateOne({ _id: message._id }, { $addToSet: { readBy: userId } });

					io.to(`room:conversation:${String(message.conversationId)}`).emit('chat:message:read', {
						conversationId: String(message.conversationId),
						messageId: String(message._id),
						userId: String(userId)
					});
					return;
				}

				if (!isObjectId(conversationId)) {
					socketError(socket, 'chat:error', 'Invalid conversationId');
					return;
				}

				const conversation = await Conversation.findOne({
					_id: conversationId,
					participantIds: userId
				})
					.select('_id')
					.lean();

				if (!conversation) {
					socketError(socket, 'chat:error', 'Conversation not found');
					return;
				}

				await Message.updateMany(
					{
						conversationId,
						senderId: { $ne: userId },
						readBy: { $ne: userId }
					},
					{ $addToSet: { readBy: userId } }
				);

				io.to(`room:conversation:${String(conversationId)}`).emit('chat:conversation:read', {
					conversationId: String(conversationId),
					userId: String(userId)
				});
			} catch (error) {
				console.error('[socket:chat] mark read failed:', error.message);
				socketError(socket, 'chat:error', 'Failed to mark message as read');
			}
		});

		socket.on('chat:sync', async ({ conversationId, since, limit = 50 } = {}) => {
			try {
				if (!conversationId || !isObjectId(conversationId)) {
					socketError(socket, 'chat:error', 'Valid conversationId is required for sync');
					return;
				}

				const conversation = await Conversation.findOne({
					_id: conversationId,
					participantIds: userId
				})
					.select('_id')
					.lean();

				if (!conversation) {
					socketError(socket, 'chat:error', 'Conversation not found');
					return;
				}

				const query = { conversationId };
				const sinceDate = since ? new Date(since) : null;
				if (sinceDate && !Number.isNaN(sinceDate.getTime())) {
					query.createdAt = { $gt: sinceDate };
				}

				const messages = await Message.find(query)
					.sort({ createdAt: 1 })
					.limit(Math.min(Math.max(Number(limit) || 50, 1), 200))
					.lean();

				socket.emit('chat:sync', {
					conversationId: String(conversationId),
					since: sinceDate ? sinceDate.toISOString() : null,
					messages,
					serverTime: new Date().toISOString()
				});
			} catch (error) {
				console.error('[socket:chat] sync failed:', error.message);
				socketError(socket, 'chat:error', 'Failed to sync conversation');
			}
		});
	});
};
