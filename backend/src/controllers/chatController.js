const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const { createNotification } = require('../services/notificationService');
const { getIO } = require('../sockets/socketState');

async function getMyConversations(req, res, next) {
  try {
    const userId = req.user.id;

    const conversations = await Conversation.find({ participantIds: userId })
      .sort({ lastMessageAt: -1, updatedAt: -1 })
      .populate('participantIds', 'fullName email role')
      .lean();

    res.json({
      success: true,
      data: { conversations }
    });
  } catch (error) {
    next(error);
  }
}

async function getConversationMessages(req, res, next) {
  try {
    const userId = req.user.id;
    const { conversationId } = req.params;

    const conversation = await Conversation.findOne({
      _id: conversationId,
      participantIds: userId
    }).lean();

    if (!conversation) {
      const error = new Error('Conversation not found');
      error.statusCode = 404;
      throw error;
    }

    const messages = await Message.find({ conversationId })
      .sort({ createdAt: 1 })
      .populate('senderId', 'fullName role')
      .lean();

    await Message.updateMany(
      {
        conversationId,
        senderId: { $ne: userId },
        readBy: { $ne: userId }
      },
      { $addToSet: { readBy: userId } }
    );

    res.json({
      success: true,
      data: { conversation, messages }
    });
  } catch (error) {
    next(error);
  }
}

async function sendMessage(req, res, next) {
  try {
    const userId = req.user.id;
    const { conversationId } = req.params;
    const { text, fileUrl, messageType } = req.body;

    const conversation = await Conversation.findOne({
      _id: conversationId,
      participantIds: userId
    });

    if (!conversation) {
      const error = new Error('Conversation not found');
      error.statusCode = 404;
      throw error;
    }

    const message = await Message.create({
      conversationId,
      senderId: userId,
      messageType: messageType || (fileUrl ? 'file' : 'text'),
      text,
      fileUrl,
      readBy: [userId]
    });

    conversation.lastMessageAt = new Date();
    await conversation.save();

    const recipientIds = conversation.participantIds
      .map((id) => String(id))
      .filter((id) => id !== String(userId));

    await Promise.all(
      recipientIds.map((recipientId) =>
        createNotification({
          userId: recipientId,
          type: 'chat',
          title: 'New Message',
          body: text ? String(text).slice(0, 120) : 'You received a new file message.',
          metadata: { conversationId, messageId: message._id }
        })
      )
    );

    const io = getIO();
    if (io) {
      const messagePayload = {
        conversationId: String(conversation._id),
        message
      };

      io.to(`room:conversation:${String(conversation._id)}`).emit('chat:message:new', messagePayload);

      conversation.participantIds.forEach((participantId) => {
        io.to(`room:user:${String(participantId)}`).emit('chat:message:new', messagePayload);
      });

      const summary = {
        _id: String(conversation._id),
        participantIds: conversation.participantIds.map((id) => String(id)),
        lastMessageAt: conversation.lastMessageAt,
        updatedAt: conversation.updatedAt
      };

      summary.participantIds.forEach((participantId) => {
        io.to(`room:user:${participantId}`).emit('chat:conversation:updated', summary);
      });
    }

    res.status(201).json({
      success: true,
      message: 'Message sent successfully',
      data: { message }
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getMyConversations,
  getConversationMessages,
  sendMessage
};
