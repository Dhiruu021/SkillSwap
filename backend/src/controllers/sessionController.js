import Session from '../models/Session.js';
import User from '../models/User.js';
import { createNotification } from '../utils/notifications.js';

const mapSessionForClient = (session) => {
  const plain = session.toObject ? session.toObject() : session;
  return {
    ...plain,
    learner: plain.learnerId,
    teacher: plain.teacherId,
  };
};

export const createSessionRequest = async (req, res) => {
  const { teacherId, skill, scheduledAt, notes, meetingLink } = req.body;

  if (!teacherId || !skill || !scheduledAt) {
    res.status(400);
    throw new Error('teacherId, skill and scheduledAt are required');
  }

  if (teacherId === req.user.id) {
    res.status(400);
    throw new Error('You cannot create a session with yourself');
  }

  const [teacher, learner] = await Promise.all([
    User.findById(teacherId).select('name'),
    User.findById(req.user.id).select('name'),
  ]);

  if (!teacher) {
    res.status(404);
    throw new Error('Teacher not found');
  }

  const session = new Session({
    learnerId: req.user.id,
    teacherId,
    skill,
    scheduledAt,
    notes,
    meetingLink
  });

  await session.save();

  const allUsers = await User.find({}, '_id');
  const creatorName = learner?.name || 'A learner';

  const notificationJobs = allUsers
    .filter((u) => u._id.toString() !== req.user.id)
    .map((u) =>
      createNotification({
        user: u._id,
        type: 'session',
        title: u._id.toString() === teacherId ? 'New session request' : 'New session booked',
        body:
          u._id.toString() === teacherId
            ? `${creatorName} requested a ${skill} session with you`
            : `${creatorName} booked a ${skill} session`,
        data: { sessionId: session._id }
      })
    );

  await Promise.all(notificationJobs);

  const createdSession = await Session.findById(session._id)
    .populate('learnerId', 'name profilePhoto')
    .populate('teacherId', 'name profilePhoto');

  res.status(201).json(mapSessionForClient(createdSession));
};

export const updateSessionStatus = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  const allowedStatuses = ['pending', 'accepted', 'rejected', 'completed', 'cancelled'];
  if (!allowedStatuses.includes(status)) {
    res.status(400);
    throw new Error('Invalid session status');
  }

  const session = await Session.findById(id);
  if (!session) {
    res.status(404);
    throw new Error('Session not found');
  }

  if (![session.teacherId.toString(), session.learnerId.toString()].includes(req.user.id)) {
    res.status(403);
    throw new Error('Not authorized to update this session');
  }

  session.status = status;
  await session.save();

  const targetUser =
    req.user.id === session.teacherId.toString()
      ? session.learnerId
      : session.teacherId;

  await createNotification({
    user: targetUser,
    type: 'session',
    title: 'Session status updated',
    body: `Session status changed to ${status}`,
    data: { sessionId: session._id }
  });

  const updatedSession = await Session.findById(session._id)
    .populate('learnerId', 'name profilePhoto')
    .populate('teacherId', 'name profilePhoto');

  res.json(mapSessionForClient(updatedSession));
};

export const getMySessions = async (req, res) => {
  const sessions = await Session.find({})
    .populate('learnerId', 'name profilePhoto')
    .populate('teacherId', 'name profilePhoto')
    .sort({ scheduledAt: 1 });

  res.json(sessions.map(mapSessionForClient));
};

