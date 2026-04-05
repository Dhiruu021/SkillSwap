import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import {
  createSessionRequest,
  updateSessionStatus,
  getMySessions
} from '../controllers/sessionController.js';

const router = express.Router();

router.get('/', protect, getMySessions);
router.post('/', protect, createSessionRequest);
router.patch('/:id/status', protect, updateSessionStatus);

export default router;

