import mongoose from 'mongoose';

const matchSchema = new mongoose.Schema({
  users: {
    type: [mongoose.Schema.Types.ObjectId],
    ref: 'User',
    required: true,
    default: [],
  },
  teachSkill: {
    type: String,
    required: true,
  },
  learnSkill: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    enum: ['pending', 'active', 'blocked'],
    default: 'active',
  },
  lastMessageAt: {
    type: Date,
  },
}, {
  timestamps: true,
});

const Match = mongoose.model('Match', matchSchema);

export default Match;

