import User from '../models/User.js';
import { generateToken } from '../utils/token.js';
import { uploadBase64Image } from '../utils/cloudinary.js';

export const register = async (req, res) => {
  const { name, email, password, bio, country, timezone, languagePreference, profilePhoto, teachSkills, learnSkills } = req.body;

  const existing = await User.findOne({ email });
  if (existing) {
    res.status(400);
    throw new Error('Email already registered');
  }

  const photoUrl = profilePhoto ? await uploadBase64Image(profilePhoto) : null;

  const user = new User({
    name,
    email,
    password,
    bio,
    country: (country || '').trim(),
    timezone: (timezone || 'UTC').trim(),
    languagePreference: languagePreference === 'hindi' ? 'hindi' : 'english',
    profilePhoto: photoUrl,
    teachSkills: teachSkills || [],
    learnSkills: learnSkills || []
  });

  await user.save();

  const token = generateToken(user._id);

  res.status(201).json({
    token,
    user: {
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
    }
  });
};

export const login = async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });
  if (!user || !(await user.matchPassword(password))) {
    res.status(401);
    throw new Error('Invalid email or password');
  }

  if (user.premiumExpiresAt && user.premiumExpiresAt <= new Date() && user.isPremium) {
    user.isPremium = false;
    await user.save();
  }

  const token = generateToken(user._id);

  res.json({
    token,
    user: {
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
      isPremium: user.isPremium,
      premiumExpiresAt: user.premiumExpiresAt
    }
  });
};

