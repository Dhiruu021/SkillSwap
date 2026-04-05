import mongoose from 'mongoose';

const reviewSchema = new mongoose.Schema({
  reviewerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  revieweeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  sessionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Session',
    required: true,
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5,
  },
  comment: {
    type: String,
    maxlength: 500,
  },
}, {
  timestamps: true,
});

// Associations
reviewSchema.virtual('reviewer', {
  ref: 'User',
  localField: 'reviewerId',
  foreignField: '_id',
  justOne: true,
});

reviewSchema.virtual('reviewee', {
  ref: 'User',
  localField: 'revieweeId',
  foreignField: '_id',
  justOne: true,
});

reviewSchema.virtual('session', {
  ref: 'Session',
  localField: 'sessionId',
  foreignField: '_id',
  justOne: true,
});

const Review = mongoose.model('Review', reviewSchema);

export default Review;

