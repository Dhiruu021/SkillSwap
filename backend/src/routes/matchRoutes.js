import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import {
  findMatchesForMe,
  createOrGetMatch,
  getMyMatches
} from '../controllers/matchController.js';

const router = express.Router();

router.get('/suggested', protect, findMatchesForMe);
router.get('/', protect, getMyMatches);
router.post('/', protect, createOrGetMatch);

export default router;

