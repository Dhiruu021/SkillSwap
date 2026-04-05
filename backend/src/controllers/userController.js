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

export const updateProfile = async (req, res) => {
  const { name, bio, country, timezone, languagePreference, profilePhoto } = req.body;
  const user = await User.findById(req.user.id);
  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  if (name) user.name = name;
  if (bio) user.bio = bio;
  if (typeof country === 'string') user.country = country.trim();
  if (typeof timezone === 'string' && timezone.trim()) user.timezone = timezone.trim();
  if (languagePreference === 'hindi' || languagePreference === 'english') {
    user.languagePreference = languagePreference;
  }
  if (profilePhoto) {
    user.profilePhoto = await uploadBase64Image(profilePhoto);
  }

  await user.save();
  res.json({
    id: user._id,
    name: user.name,
    email: user.email,
    profilePhoto: user.profilePhoto,
    bio: user.bio,
    country: user.country,
    timezone: user.timezone,
    languagePreference: user.languagePreference,
    teachSkills: user.teachSkills,
    learnSkills: user.learnSkills,
    averageRating: user.averageRating,
    isPremium: user.isPremium
  });
};

export const purchasePremium = async (req, res) => {
  const { planId, paymentReference } = req.body;

  if (!planId || !paymentReference || !paymentReference.trim()) {
    res.status(400);
    throw new Error('Plan and payment reference are required');
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

  const trimmedRef = paymentReference.trim();
  const existingPayment = await User.findOne({ 'premiumPayments.reference': trimmedRef });
  if (existingPayment && existingPayment._id.toString() !== req.user.id) {
    res.status(400);
    throw new Error('This payment reference has already been used');
  }

  const user = await User.findById(req.user.id);
  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  const now = new Date();
  const baseDate = user.premiumExpiresAt && user.premiumExpiresAt > now ? new Date(user.premiumExpiresAt) : now;
  const expiresAt = new Date(baseDate);
  expiresAt.setDate(expiresAt.getDate() + selectedPlan.days);

  user.isPremium = true;
  user.premiumExpiresAt = expiresAt;
  user.premiumPayments.push({
    planId,
    reference: trimmedRef,
    amount: selectedPlan.price,
    expiresAt,
    createdAt: now,
  });

  await user.save();

  res.json({
    message: `Premium activated for ${selectedPlan.label}. Valid until ${expiresAt.toDateString()}.`,
    isPremium: true,
    premiumExpiresAt: expiresAt,
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

