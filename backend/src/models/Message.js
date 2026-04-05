import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
  chatId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Chat',
    required: true,
  },
  senderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  content: {
    type: String,
  },
  fileUrl: {
    type: String,
  },
  fileType: {
    type: String,
  },
  isRead: {
    type: Boolean,
    default: false,
  },
}, {
  timestamps: true,
});

const Message = mongoose.model('Message', messageSchema);

export default Message;

