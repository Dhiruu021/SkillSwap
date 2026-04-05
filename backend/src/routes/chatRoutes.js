import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import {
  getMyChats,
  getMessagesForChat,
  sendMessageRest,
  createChatForMatch
} from '../controllers/chatController.js';

const router = express.Router();

router.get('/', protect, getMyChats);
router.post('/from-match', protect, createChatForMatch);
router.get('/:chatId/messages', protect, getMessagesForChat);
router.post('/:chatId/messages', protect, sendMessageRest);

export default router;

