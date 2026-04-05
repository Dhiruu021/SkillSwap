import User from '../models/User.js';
import Match from '../models/Match.js';
import Chat from '../models/Chat.js';
import { createNotification } from '../utils/notifications.js';

// Simple symmetric matching:
// For current user U:
//  - Find users where U.teach intersects other.learn
//  - And U.learn intersects other.teach
export const findMatchesForMe = async (req, res) => {
  const me = await User.findById(req.user.id);
  if (!me) {
    res.status(404);
    throw new Error('User not found');
  }

  const myTeach = me.teachSkills.map((s) => s.toLowerCase());
  const myLearn = me.learnSkills.map((s) => s.toLowerCase());

  const others = await User.find({
    _id: { $ne: me._id },
    $or: [
      { learnSkills: { $in: myTeach } },
      { teachSkills: { $in: myLearn } }
    ]
  });

  const results = [];

  for (const other of others) {
    const otherTeach = other.teachSkills.map((s) => s.toLowerCase());
    const otherLearn = other.learnSkills.map((s) => s.toLowerCase());

    const teachToLearn = myTeach.filter((s) => otherLearn.includes(s));
    const learnToTeach = myLearn.filter((s) => otherTeach.includes(s));

    if (teachToLearn.length && learnToTeach.length) {
      results.push({
        user: {
          id: other._id,
          name: other.name,
          profilePhoto: other.profilePhoto,
          bio: other.bio,
          country: other.country,
          averageRating: other.averageRating
        },
        teachToLearn,
        learnToTeach
      });
    }
  }

  res.json(results);
};

export const createOrGetMatch = async (req, res) => {
  const { otherUserId, teachSkill, learnSkill } = req.body;
  const userId = req.user.id;

  let match = await Match.findOne({
    users: { $all: [userId, otherUserId] },
    teachSkill,
    learnSkill
  });

  if (!match) {
    match = new Match({
      users: [userId, otherUserId],
      teachSkill,
      learnSkill
    });

    await match.save();

    // Create chat for the match
    const chat = new Chat({
      participants: [userId, otherUserId],
      matchId: match._id
    });
    await chat.save();

    await createNotification({
      user: otherUserId,
      type: 'match',
      title: 'New skill match found!',
      body: 'You have a new skill match. Start chatting to schedule a session.',
      data: { matchId: match._id }
    });
  }

  res.status(201).json(match);
};

export const getMyMatches = async (req, res) => {
  const matches = await Match.find({
    users: req.user.id
  }).sort({ updatedAt: -1 });

  for (let match of matches) {
    const users = await User.find({
      _id: { $in: match.users }
    }).select('id name profilePhoto country averageRating');

    match.users = users;

    // Ensure chat exists for this match
    let chat = await Chat.findOne({
      participants: { $all: match.users.map(u => u._id) },
      matchId: match._id
    });

    if (!chat) {
      chat = new Chat({
        participants: match.users.map(u => u._id),
        matchId: match._id
      });
      await chat.save();
    }
  }

  res.json(matches);
};

