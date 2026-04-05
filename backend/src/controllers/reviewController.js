import Review from '../models/Review.js';
import Session from '../models/Session.js';
import User from '../models/User.js';

export const createReview = async (req, res) => {
  const { sessionId, revieweeId, rating, comment } = req.body;

  const session = await Session.findById(sessionId);
  if (!session) {
    res.status(404);
    throw new Error('Session not found');
  }

  if (
    ![session.teacherId.toString(), session.learnerId.toString()].includes(req.user.id)
  ) {
    res.status(403);
    throw new Error('Not authorized to review this session');
  }

  const review = new Review({
    reviewerId: req.user.id,
    revieweeId,
    sessionId,
    rating,
    comment
  });

  await review.save();

  // Update average rating on user
  const reviews = await Review.find({ revieweeId });
  const avgRating = reviews.length ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length : 0;
  const count = reviews.length;

  await User.findByIdAndUpdate(revieweeId, {
    averageRating: avgRating,
    reviewCount: count
  });

  res.status(201).json(review);
};

