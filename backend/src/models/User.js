import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    validate: {
      validator: function(v) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
      },
      message: 'Invalid email format',
    },
  },
  password: {
    type: String,
    required: true,
    minlength: 6,
  },
  profilePhoto: {
    type: String,
  },
  bio: {
    type: String,
    maxlength: 500,
  },
  country: {
    type: String,
    trim: true,
    maxlength: 80,
    default: '',
  },
  timezone: {
    type: String,
    trim: true,
    maxlength: 80,
    default: 'UTC',
  },
  languagePreference: {
    type: String,
    enum: ['english', 'hindi'],
    default: 'english',
  },
  teachSkills: {
    type: [String],
    default: [],
  },
  learnSkills: {
    type: [String],
    default: [],
  },
  averageRating: {
    type: Number,
    default: 0,
  },
  reviewCount: {
    type: Number,
    default: 0,
  },
  isOnline: {
    type: Boolean,
    default: false,
  },
  lastActiveAt: {
    type: Date,
    default: Date.now,
  },
  isPremium: {
    type: Boolean,
    default: false,
  },
  premiumExpiresAt: {
    type: Date,
    default: null,
  },
  premiumPayments: {
    type: [
      {
        planId: String,
        reference: String,
        amount: Number,
        expiresAt: Date,
        createdAt: {
          type: Date,
          default: Date.now,
        },
      }
    ],
    default: [],
  },
}, {
  timestamps: true,
});

// Pre-save hook for password hashing
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Instance method for password matching
userSchema.methods.matchPassword = async function(enteredPassword) {
  return bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.model('User', userSchema);

export default User;

