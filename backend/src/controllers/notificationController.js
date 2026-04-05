import Notification from '../models/Notification.js';

export const getMyNotifications = async (req, res) => {
  const notifications = await Notification.find({
    userId: req.user.id
  }).sort({ createdAt: -1 });
  res.json(notifications);
};

export const markAsRead = async (req, res) => {
  const { id } = req.params;
  const notification = await Notification.findOneAndUpdate(
    { _id: id, userId: req.user.id },
    { isRead: true },
    { new: true }
  );
  if (!notification) {
    res.status(404);
    throw new Error('Notification not found');
  }
  res.json(notification);
};

