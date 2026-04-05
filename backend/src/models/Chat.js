import mongoose from 'mongoose';

const chatSchema = new mongoose.Schema({
  participants: {
    type: [mongoose.Schema.Types.ObjectId],
    ref: 'User',
    required: true,
    default: [],
  },
  matchId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Match',
  },
  participantKey: {
    type: String,
    required: false,
  },
  firstMessageAt: {
    type: Date,
    default: null,
  },
}, {
  timestamps: true,
});

chatSchema.pre('save', function(next) {
  if (this.participants) {
    this.participants.sort((a, b) => a.toString().localeCompare(b.toString()));
    this.participantKey = this.participants.map(id => id.toString()).join(',');
  }
  next();
});

chatSchema.index({ participantKey: 1, matchId: 1 }, { unique: true, sparse: true });

const Chat = mongoose.model('Chat', chatSchema);

export default Chat;

