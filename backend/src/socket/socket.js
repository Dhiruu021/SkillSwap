import User from '../models/User.js';
import Message from '../models/Message.js';
import Chat from '../models/Chat.js';
import { uploadChatFile } from '../utils/cloudinary.js';
import { sanitizeChatContent } from '../utils/chatSanitizer.js';
import { createNotification } from '../utils/notifications.js';

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

      const sender = await User.findById(senderId).select('name isPremium');
      const hasPremium = sender?.isPremium;

      for (const p of otherParticipants) {
        await createNotification({
          user: p,
          type: 'message',
          title: 'New message',
          body: `${sender.name} sent you a message.`,
          data: { chatId }
        });
      }

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

