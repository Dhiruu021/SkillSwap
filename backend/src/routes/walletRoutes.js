import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import { getWallet, deposit, withdraw, savePaymentMethod } from '../controllers/walletController.js';

const router = express.Router();

router.get('/', protect, getWallet);
router.post('/deposit', protect, deposit);
router.post('/withdraw', protect, withdraw);
router.post('/saved-methods', protect, savePaymentMethod);

export default router;
