import Chat from '../models/Chat.js';
import Message from '../models/Message.js';
import Match from '../models/Match.js';
import User from '../models/User.js';
import { uploadChatFile } from '../utils/cloudinary.js';
import { createNotification } from '../utils/notifications.js';
import { sanitizeChatContent } from '../utils/chatSanitizer.js';

export const getMyChats = async (req, res) => {
  const chats = await Chat.find({
    participants: req.user.id
  }).populate('participants', 'name profilePhoto isOnline lastActiveAt').sort({ updatedAt: -1 });

  const enrichedChats = await Promise.all(
    chats.map(async (chat) => {
      const [lastMessage, unreadCount] = await Promise.all([
        Message.findOne({ chatId: chat._id }).sort({ createdAt: -1 }),
        Message.countDocuments({
          chatId: chat._id,
          senderId: { $ne: req.user.id },
          isRead: false
        })
      ]);

      return {
        ...chat.toObject(),
        lastMessage: lastMessage
          ? { ...lastMessage.toObject(), content: sanitizeChatContent(lastMessage.content) }
          : null,
        unreadCount
      };
    })
  );

  res.json(enrichedChats);
};

export const getMessagesForChat = async (req, res) => {
  const { chatId } = req.params;
  const messages = await Message.find({ chatId })
    .populate('senderId', 'name profilePhoto')
    .sort({ createdAt: 1 });

  // Mark messages as read for the current user (messages not sent by them)
  await Message.updateMany(
    { chatId, senderId: { $ne: req.user.id }, isRead: false },
    { isRead: true }
  );

  const sanitizedMessages = messages.map((message) => {
    const messageObj = message.toObject();
    return {
      ...messageObj,
      content: sanitizeChatContent(messageObj.content)
    };
  });

  res.json(sanitizedMessages);
};

export const sendMessageRest = async (req, res) => {
  const { chatId } = req.params;
  const { content, fileBase64, fileType } = req.body;

  const chat = await Chat.findById(chatId);
  if (!chat) {
    res.status(404);
    throw new Error('Chat not found');
  }

  const sender = await User.findById(req.user.id).select('name isPremium');
  const hasPremium = sender?.isPremium;
  const referenceTime = chat.firstMessageAt || null;
  const freeWindowMs = 60 * 1000;
  const freeAllowed = !referenceTime || Date.now() - new Date(referenceTime).getTime() <= freeWindowMs;

  if (!hasPremium && !freeAllowed) {
    res.status(403);
    throw new Error('Your 1 minute free chat has ended. Upgrade to Premium to continue messaging.');
  }

  let fileUrl;
  if (fileBase64) {
    fileUrl = await uploadChatFile(fileBase64);
  }

  const message = new Message({
    chatId,
    senderId: req.user.id,
    content: sanitizeChatContent(content),
    fileUrl,
    fileType
  });

  await message.save();

  if (!chat.firstMessageAt) {
    chat.firstMessageAt = new Date();
  }
  chat.updatedAt = new Date();
  await chat.save();

  const otherParticipants = chat.participants.filter(
    (p) => p.toString() !== req.user.id
  );

  for (const p of otherParticipants) {
    await createNotification({
      user: p,
      type: 'message',
      title: 'New message',
      body: `${sender.name} sent you a message.`,
      data: { chatId }
    });
  }

  res.status(201).json(message);
};

export const createChatForMatch = async (req, res) => {
  const { matchId } = req.body;
  const match = await Match.findById(matchId);
  if (!match) {
    res.status(404);
    throw new Error('Match not found');
  }

  const sortedParticipants = [...match.users].sort((a, b) => a.toString().localeCompare(b.toString()));
  const participantKey = sortedParticipants.map(id => id.toString()).join(',');

  let chat = await Chat.findOne({
    participantKey,
    matchId: match._id
  });

  if (!chat) {
    chat = new Chat({
      participants: sortedParticipants,
      matchId: match._id,
      participantKey
    });
    await chat.save();
  }

  res.status(201).json(chat);
};

