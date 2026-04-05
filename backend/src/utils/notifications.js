import Notification from '../models/Notification.js';

export const createNotification = async ({ user, type, title, body, data }) => {
  if (!user) return null;
  const notification = new Notification({
    userId: user,
    type,
    title,
    body,
    data
  });
  await notification.save();
  return notification;
};

