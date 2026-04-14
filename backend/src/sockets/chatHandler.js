const mongoose = require('mongoose');

const Conversation = require('../models/Conversation');
const Message = require('../models/Message');

module.exports = function chatHandler(io) {
	io.on('connection', (socket) => {
		const userId = socket.handshake.auth?.userId || socket.handshake.query?.userId;

		if (userId && mongoose.Types.ObjectId.isValid(String(userId))) {
			socket.join(`room:user:${String(userId)}`);
		}

		socket.on('chat:joinConversation', async ({ conversationId }) => {
			if (!conversationId || !mongoose.Types.ObjectId.isValid(String(conversationId))) {
				return;
			}

			socket.join(`room:conversation:${String(conversationId)}`);
		});

		socket.on('chat:message:send', async (payload = {}) => {
			try {
				const senderId = payload.senderId || userId;
				const { conversationId, toUserId, text, fileUrl, messageType } = payload;

				if (!senderId || !mongoose.Types.ObjectId.isValid(String(senderId))) {
					return;
				}

				let conversation = null;
				if (conversationId && mongoose.Types.ObjectId.isValid(String(conversationId))) {
					conversation = await Conversation.findById(conversationId);
				}

				if (!conversation && toUserId && mongoose.Types.ObjectId.isValid(String(toUserId))) {
					conversation = await Conversation.findOne({
						participantIds: { $all: [senderId, toUserId] }
					});

					if (!conversation) {
						conversation = await Conversation.create({
							participantIds: [senderId, toUserId],
							lastMessageAt: new Date()
						});
					}
				}

				if (!conversation) {
					return;
				}

				const message = await Message.create({
					conversationId: conversation._id,
					senderId,
					messageType: messageType || (fileUrl ? 'file' : 'text'),
					text,
					fileUrl,
					readBy: [senderId]
				});

				conversation.lastMessageAt = new Date();
				await conversation.save();

				io.to(`room:conversation:${String(conversation._id)}`).emit('chat:message:new', message);
			} catch (error) {
				console.error('[socket:chat] message send failed:', error.message);
			}
		});

		socket.on('chat:message:read', async ({ messageId }) => {
			try {
				if (
					!userId ||
					!messageId ||
					!mongoose.Types.ObjectId.isValid(String(userId)) ||
					!mongoose.Types.ObjectId.isValid(String(messageId))
				) {
					return;
				}

				const message = await Message.findByIdAndUpdate(
					messageId,
					{ $addToSet: { readBy: userId } },
					{ new: true }
				);

				if (!message) {
					return;
				}

				io.to(`room:conversation:${String(message.conversationId)}`).emit('chat:message:read', {
					messageId: String(message._id),
					userId: String(userId)
				});
			} catch (error) {
				console.error('[socket:chat] mark read failed:', error.message);
			}
		});
	});
};
