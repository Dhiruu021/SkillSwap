import crypto from 'crypto';
import User from '../models/User.js';
import { generateToken } from '../utils/token.js';
import { uploadBase64Image } from '../utils/cloudinary.js';
import { sendPasswordResetEmail } from '../utils/email.js';

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

export const forgotPassword = async (req, res) => {
  const { email } = req.body;

  if (!email || !email.trim()) {
    res.status(400);
    throw new Error('Email is required');
  }

  const user = await User.findOne({ email: email.toLowerCase().trim() });
  if (user) {
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');

    user.passwordResetToken = resetTokenHash;
    user.passwordResetExpires = Date.now() + 60 * 60 * 1000;
    await user.save();

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const resetUrl = `${frontendUrl}/reset-password/${resetToken}`;

    const mailResult = await sendPasswordResetEmail({
      email: user.email,
      name: user.name,
      resetUrl,
    });

    if (!mailResult.sent && mailResult.reason === 'no_config') {
      const isDev = process.env.NODE_ENV !== 'production';
      if (isDev) {
        return res.json({
          message:
            'Email is not configured on the server. For local testing, use the reset link below (production: set EMAIL_USER + EMAIL_PASS + EMAIL_HOST or EMAIL_SERVICE).',
          devResetUrl: resetUrl,
        });
      }
      res.status(503);
      throw new Error(
        'Password reset email could not be sent because outgoing mail is not configured. Please contact support.'
      );
    }
  }

  res.json({
    message: 'If this email is registered with SkillSwap, password reset instructions have been sent.',
  });
};

export const resetPassword = async (req, res) => {
  const { token } = req.params;
  const { password } = req.body;

  if (!password || password.length < 6) {
    res.status(400);
    throw new Error('Password must be at least 6 characters long');
  }

  const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() },
  });

  if (!user) {
    res.status(400);
    throw new Error('Reset token is invalid or has expired');
  }

  user.password = password;
  user.passwordResetToken = null;
  user.passwordResetExpires = null;
  await user.save();

  res.json({ message: 'Password reset successfully. You can now log in with your new password.' });
};

