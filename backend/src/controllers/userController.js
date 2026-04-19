import User from '../models/User.js';
import Review from '../models/Review.js';
import { uploadBase64Image } from '../utils/cloudinary.js';

export const getMe = async (req, res) => {
  const user = await User.findById(req.user.id).select('-password');
  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  if (user.premiumExpiresAt && user.premiumExpiresAt <= new Date() && user.isPremium) {
    user.isPremium = false;
    await user.save();
  }

  res.json(user);
};

export const getUserByUsername = async (req, res) => {
  const { username } = req.params;
  const user = await User.findOne({ username: username.toLowerCase() }).select('-password -email -walletBalance -walletTransactions -savedPaymentMethods -passwordResetToken -passwordResetExpires');
  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  res.json({
    id: user._id,
    name: user.name,
    username: user.username,
    profilePhoto: user.profilePhoto,
    bio: user.bio,
    country: user.country,
    timezone: user.timezone,
    languagePreference: user.languagePreference,
    gender: user.gender,
    teachSkills: user.teachSkills,
    learnSkills: user.learnSkills,
    averageRating: user.averageRating,
    reviewCount: user.reviewCount,
    isOnline: user.isOnline,
    lastActiveAt: user.lastActiveAt,
    isPremium: user.isPremium
  });
};

export const updateProfile = async (req, res) => {
  const { name, username, bio, country, timezone, languagePreference, gender, profilePhoto } = req.body;
  const user = await User.findById(req.user.id);
  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  if (name) user.name = name;
  if (username) {
    const trimmedUsername = username.toLowerCase().trim();
    const existingUsername = await User.findOne({ username: trimmedUsername });
    if (existingUsername && existingUsername._id.toString() !== user._id.toString()) {
      res.status(400);
      throw new Error('Username already taken');
    }
    user.username = trimmedUsername;
  }
  if (bio) user.bio = bio;
  if (typeof country === 'string') user.country = country.trim();
  if (typeof timezone === 'string' && timezone.trim()) user.timezone = timezone.trim();
  if (languagePreference === 'hindi' || languagePreference === 'english') {
    user.languagePreference = languagePreference;
  }
  if (gender && (gender === 'male' || gender === 'female')) {
    user.gender = gender;
  }
  if (profilePhoto) {
    try {
      user.profilePhoto = await uploadBase64Image(profilePhoto);
    } catch (error) {
      console.error('Error uploading profile photo:', error);
      // Continue without updating photo
    }
  }

  await user.save();
  res.json({
    id: user._id,
    name: user.name,
    username: user.username,
    email: user.email,
    profilePhoto: user.profilePhoto,
    bio: user.bio,
    country: user.country,
    timezone: user.timezone,
    languagePreference: user.languagePreference,
    gender: user.gender,
    teachSkills: user.teachSkills,
    learnSkills: user.learnSkills,
    averageRating: user.averageRating,
    isPremium: user.isPremium
  });
};

export const purchasePremium = async (req, res) => {
  const { planId } = req.body;

  if (!planId) {
    res.status(400);
    throw new Error('Premium plan is required');
  }

  const planConfig = {
    monthly: { price: 99, days: 30, label: '1 Month' },
    quarterly: { price: 199, days: 90, label: '3 Months' },
    yearly: { price: 499, days: 365, label: '1 Year' },
  };

  const selectedPlan = planConfig[planId];
  if (!selectedPlan) {
    res.status(400);
    throw new Error('Invalid premium plan selected');
  }

  const user = await User.findById(req.user.id);
  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  const price = selectedPlan.price;
  if (typeof user.walletBalance !== 'number' || user.walletBalance < price) {
    res.status(400);
    throw new Error('Insufficient wallet balance. Please add funds to your wallet and try again.');
  }

  const now = new Date();
  const baseDate = user.premiumExpiresAt && user.premiumExpiresAt > now ? new Date(user.premiumExpiresAt) : now;
  const expiresAt = new Date(baseDate);
  expiresAt.setDate(expiresAt.getDate() + selectedPlan.days);

  const trnId = `PREM-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
  const walletTx = {
    trnId,
    type: 'debit',
    amount: price,
    method: 'Wallet',
    methodId: 'wallet',
    flow: 'out',
    counterpartyName: 'SkillSwap Premium',
    detailLine: `Premium chat (${selectedPlan.label})`,
    headline: `Premium chat purchase`,
    meta: { planId, premium: true },
    createdAt: now,
  };

  user.walletBalance -= price;
  user.premiumPayments.push({
    planId,
    reference: 'wallet',
    amount: price,
    expiresAt,
    createdAt: now,
  });
  user.walletTransactions.push(walletTx);
  user.isPremium = true;
  user.premiumExpiresAt = expiresAt;

  await user.save();

  res.json({
    message: `Premium activated for ${selectedPlan.label}. Valid until ${expiresAt.toDateString()}.`,
    isPremium: true,
    premiumExpiresAt: expiresAt,
    walletBalance: user.walletBalance,
  });
};

export const getUserById = async (req, res) => {
  const user = await User.findById(req.params.id).select('-password');
  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }
  const reviews = await Review.find({ revieweeId: user._id })
    .populate('reviewer', 'name profilePhoto')
    .sort({ createdAt: -1 });
  res.json({ user, reviews });
};

export const searchUsersBySkill = async (req, res) => {
  const { skill } = req.query;
  if (!skill) {
    res.status(400);
    throw new Error('Skill query is required');
  }

  const users = await User.find({
    $or: [
      { teachSkills: skill },
      { learnSkills: skill }
    ]
  }).select('-password');

  res.json(users);
};

