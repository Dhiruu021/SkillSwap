import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import {
  getMe,
  updateProfile,
  getUserById,
  getUserByUsername,
  searchUsersBySkill,
  purchasePremium
} from '../controllers/userController.js';

const router = express.Router();

router.get('/me', protect, getMe);
router.put('/me', protect, updateProfile);
router.post('/me/premium', protect, purchasePremium);
router.get('/search', protect, searchUsersBySkill);
router.get('/:id', protect, getUserById);
router.get('/profile/:username', getUserByUsername);

export default router;

