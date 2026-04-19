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
  gender: {
    type: String,
    enum: ['male', 'female'],
    default: null,
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
  walletBalance: {
    type: Number,
    default: 0,
    min: 0,
  },
  walletTransactions: {
    type: [
      {
        trnId: { type: String, required: true },
        type: { type: String, enum: ['credit', 'debit'], required: true },
        amount: { type: Number, required: true, min: 0 },
        method: String,
        methodId: String,
        flow: { type: String, enum: ['in', 'out'], default: 'in' },
        counterpartyName: String,
        detailLine: String,
        headline: String,
        meta: { type: mongoose.Schema.Types.Mixed, default: {} },
        createdAt: { type: Date, default: Date.now },
      },
    ],
    default: [],
  },
  savedPaymentMethods: {
    type: [
      {
        methodId: { type: String, required: true },
        holderName: String,
        upiId: String,
        bankAccount: String,
        ifsc: String,
        otherDetail: String,
        createdAt: { type: Date, default: Date.now },
      },
    ],
    default: [],
  },
  passwordResetToken: {
    type: String,
    default: null,
  },
  passwordResetExpires: {
    type: Date,
    default: null,
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

