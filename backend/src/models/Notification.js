import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  type: {
    type: String,
    enum: ['match', 'message', 'session', 'reminder'],
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
  body: {
    type: String,
    required: true,
  },
  data: {
    type: mongoose.Schema.Types.Mixed,
  },
  isRead: {
    type: Boolean,
    default: false,
  },
}, {
  timestamps: true,
});

// TTL index for auto-deletion after 24 hours
notificationSchema.index({ createdAt: 1 }, { expireAfterSeconds: 86400 });

const Notification = mongoose.model('Notification', notificationSchema);

export default Notification;

