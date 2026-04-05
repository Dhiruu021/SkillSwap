import mongoose from 'mongoose';

const sessionSchema = new mongoose.Schema({
  learnerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  teacherId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  skill: {
    type: String,
    required: true,
  },
  scheduledAt: {
    type: Date,
    required: true,
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'rejected', 'completed', 'cancelled'],
    default: 'pending',
  },
  notes: {
    type: String,
  },
  meetingLink: {
    type: String,
    trim: true,
  },
}, {
  timestamps: true,
});

// Virtuals for associations
sessionSchema.virtual('learner', {
  ref: 'User',
  localField: 'learnerId',
  foreignField: '_id',
  justOne: true,
});

sessionSchema.virtual('teacher', {
  ref: 'User',
  localField: 'teacherId',
  foreignField: '_id',
  justOne: true,
});

const Session = mongoose.model('Session', sessionSchema);

export default Session;

