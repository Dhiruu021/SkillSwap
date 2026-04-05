import User from '../models/User.js';
import Message from '../models/Message.js';
import Chat from '../models/Chat.js';
import { uploadChatFile } from '../utils/cloudinary.js';
import { sanitizeChatContent } from '../utils/chatSanitizer.js';

const onlineUsers = new Map(); // userId -> socketId

export const initSocket = (io) => {
  io.on('connection', (socket) => {
    socket.on('authenticate', async ({ userId }) => {
      if (!userId) return;
      onlineUsers.set(userId, socket.id);
      await User.findByIdAndUpdate(userId, {
        isOnline: true,
        lastActiveAt: new Date()
      });
      io.emit('onlineUsers', Array.from(onlineUsers.keys()));
    });

    socket.on('joinChat', ({ chatId }) => {
      socket.join(chatId);
    });

    socket.on('typing', ({ chatId, userId, userName, isTyping }) => {
      socket.to(chatId).emit('typing', { chatId, userId, userName, isTyping });
    });

    socket.on('stopTyping', ({ chatId }) => {
      socket.to(chatId).emit('stopTyping', { chatId });
    });

    socket.on('sendMessage', async ({ chatId, senderId, content, fileBase64, fileType }) => {
      const chat = await Chat.findById(chatId);
      if (!chat) return;

      const sender = await User.findById(senderId).select('isPremium');
      const hasPremium = sender?.isPremium;
      const referenceTime = chat.firstMessageAt || null;
      const freeWindowMs = 60 * 1000;
      const freeAllowed = !referenceTime || Date.now() - new Date(referenceTime).getTime() <= freeWindowMs;

      if (!hasPremium && !freeAllowed) {
        socket.emit('messageError', {
          chatId,
          message: 'Your 1 minute free chat has ended. Upgrade to Premium to continue messaging.'
        });
        return;
      }

      let fileUrl;
      if (fileBase64) {
        fileUrl = await uploadChatFile(fileBase64);
      }

      const message = new Message({
        chatId,
        senderId,
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

      const populated = await Message.findById(message._id).populate('senderId', 'name profilePhoto');
      io.to(chatId).emit('newMessage', populated);
    });

    socket.on('seenMessage', async ({ chatId, userId }) => {
      if (!chatId || !userId) return;

      const latestUnseen = await Message.findOneAndUpdate(
        { chatId, senderId: { $ne: userId }, isRead: false },
        { isRead: true },
        { sort: { createdAt: -1 }, new: true }
      );

      if (latestUnseen) {
        io.to(chatId).emit('messageSeen', { chatId, messageId: latestUnseen._id });
      }
    });

    socket.on('disconnect', async () => {
      for (const [userId, sId] of onlineUsers.entries()) {
        if (sId === socket.id) {
          onlineUsers.delete(userId);
          await User.findByIdAndUpdate(userId, {
            isOnline: false,
            lastActiveAt: new Date()
          });
          break;
        }
      }
      io.emit('onlineUsers', Array.from(onlineUsers.keys()));
    });
  });
};

