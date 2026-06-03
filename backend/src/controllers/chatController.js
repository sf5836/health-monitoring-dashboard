const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const DoctorProfile = require('../models/DoctorProfile');
const PatientProfile = require('../models/PatientProfile');
const User = require('../models/User');
const { createNotification } = require('../services/notificationService');
const { getIO } = require('../sockets/socketState');

async function ensurePatientDoctorConnection(patientId, doctorId) {
  const profile = await PatientProfile.findOne({
    userId: patientId,
    connectedDoctorIds: doctorId
  })
    .select('_id')
    .lean();

  if (!profile) {
    const error = new Error('Patient is not connected to this doctor');
    error.statusCode = 403;
    throw error;
  }
}

async function ensureConversationAccessAllowed(conversation, requester) {
  if (requester.role === 'admin') {
    return;
  }

  const participantIds = (conversation.participantIds || []).map((value) => String(value));
  if (!participantIds.includes(String(requester.id))) {
    const error = new Error('Conversation not found');
    error.statusCode = 404;
    throw error;
  }

  if (participantIds.length !== 2) {
    return;
  }

  const participants = await User.find({ _id: { $in: participantIds }, isActive: true })
    .select('_id role')
    .lean();

  if (participants.length !== 2) {
    const error = new Error('Conversation participants are invalid');
    error.statusCode = 403;
    throw error;
  }

  const patient = participants.find((item) => item.role === 'patient');
  const doctor = participants.find((item) => item.role === 'doctor');

  if (patient && doctor) {
    await ensurePatientDoctorConnection(String(patient._id), String(doctor._id));
    return;
  }

  const error = new Error('Conversation type is not allowed');
  error.statusCode = 403;
  throw error;
}

async function attachParticipantPhotos(conversations) {
  const ids = new Set();

  conversations.forEach((conversation) => {
    (conversation.participantIds || []).forEach((participant) => {
      if (!participant) return;
      if (typeof participant === 'string') {
        ids.add(String(participant));
        return;
      }
      const id = participant._id || participant.id;
      if (id) ids.add(String(id));
    });
  });

  if (ids.size === 0) return conversations;

  const idList = Array.from(ids);

  const [doctorProfiles, patientProfiles] = await Promise.all([
    DoctorProfile.find({ userId: { $in: idList } })
      .select('userId profilePhoto')
      .lean(),
    PatientProfile.find({ userId: { $in: idList } })
      .select('userId profilePhoto')
      .lean()
  ]);

  const profilePhotoMap = new Map();
  doctorProfiles.forEach((profile) => {
    profilePhotoMap.set(String(profile.userId), profile.profilePhoto);
  });
  patientProfiles.forEach((profile) => {
    if (!profilePhotoMap.has(String(profile.userId))) {
      profilePhotoMap.set(String(profile.userId), profile.profilePhoto);
    }
  });

  return conversations.map((conversation) => ({
    ...conversation,
    participantIds: (conversation.participantIds || []).map((participant) => {
      if (!participant || typeof participant === 'string') return participant;
      const id = String(participant._id || participant.id || '');
      const profilePhoto = id ? profilePhotoMap.get(id) : undefined;
      return {
        ...participant,
        profilePhoto
      };
    })
  }));
}

async function createOrGetConversation(req, res, next) {
  try {
    const requester = { id: req.user.id, role: req.user.role };
    const { toUserId } = req.body;

    if (String(toUserId) === String(requester.id)) {
      const error = new Error('Cannot create conversation with yourself');
      error.statusCode = 400;
      throw error;
    }

    const targetUser = await User.findOne({ _id: toUserId, isActive: true })
      .select('_id fullName email role')
      .lean();

    if (!targetUser) {
      const error = new Error('Target user not found');
      error.statusCode = 404;
      throw error;
    }

    if (requester.role !== 'admin') {
      const patientId = requester.role === 'patient' ? requester.id : targetUser.role === 'patient' ? String(targetUser._id) : null;
      const doctorId = requester.role === 'doctor' ? requester.id : targetUser.role === 'doctor' ? String(targetUser._id) : null;

      if (!patientId || !doctorId) {
        const error = new Error('Only patient-doctor conversations are allowed');
        error.statusCode = 403;
        throw error;
      }

      await ensurePatientDoctorConnection(patientId, doctorId);
    }

    let conversation = await Conversation.findOne({
      $and: [
        { participantIds: { $all: [requester.id, toUserId] } },
        { participantIds: { $size: 2 } }
      ]
    });

    if (!conversation) {
      conversation = await Conversation.create({
        participantIds: [requester.id, toUserId],
        lastMessageAt: new Date()
      });
    }

    await ensureConversationAccessAllowed(conversation, requester);

    const populatedConversation = await Conversation.findById(conversation._id)
      .populate('participantIds', 'fullName email role')
      .lean();

    const [hydratedConversation] = await attachParticipantPhotos([populatedConversation]);

    res.status(201).json({
      success: true,
      message: 'Conversation ready',
      data: { conversation: hydratedConversation }
    });
  } catch (error) {
    next(error);
  }
}

async function getMyConversations(req, res, next) {
  try {
    const userId = req.user.id;

    const conversations = await Conversation.find({ participantIds: userId })
      .sort({ lastMessageAt: -1, updatedAt: -1 })
      .populate('participantIds', 'fullName email role')
      .lean();

    const hydratedConversations = await attachParticipantPhotos(conversations);

    res.json({
      success: true,
      data: { conversations: hydratedConversations }
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
    });

    if (!conversation) {
      const error = new Error('Conversation not found');
      error.statusCode = 404;
      throw error;
    }

    await ensureConversationAccessAllowed(conversation, {
      id: userId,
      role: req.user.role
    });

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

    await ensureConversationAccessAllowed(conversation, {
      id: userId,
      role: req.user.role
    });

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
  createOrGetConversation,
  getMyConversations,
  getConversationMessages,
  sendMessage
};
