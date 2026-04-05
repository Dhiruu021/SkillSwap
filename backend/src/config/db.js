import connectDB from './dbConnection.js';
import User from '../models/User.js';
import Chat from '../models/Chat.js';
import Message from '../models/Message.js';
import Match from '../models/Match.js';
import Notification from '../models/Notification.js';
import Review from '../models/Review.js';
import Session from '../models/Session.js';

try {
  await connectDB();
  console.log('Database connected');
} catch (error) {
  console.error('Unable to connect to the database:', error);
  process.exit(1);
}

// No associations needed in Mongoose, handled in schemas

export default connectDB;

