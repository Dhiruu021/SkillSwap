import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import { getMySkills, updateMySkills } from '../controllers/skillController.js';

const router = express.Router();

router.get('/me', protect, getMySkills);
router.put('/me', protect, updateMySkills);

export default router;

