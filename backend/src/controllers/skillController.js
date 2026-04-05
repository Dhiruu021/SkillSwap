import User from '../models/User.js';

export const getMySkills = async (req, res) => {
  const user = await User.findById(req.user.id);
  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }
  res.json({ teachSkills: user.teachSkills, learnSkills: user.learnSkills });
};

export const updateMySkills = async (req, res) => {
  const { teachSkills, learnSkills } = req.body;
  const user = await User.findById(req.user.id);
  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  if (teachSkills) {
    user.teachSkills = teachSkills;
  }
  if (learnSkills) {
    user.learnSkills = learnSkills;
  }

  await user.save();
  res.json({ teachSkills: user.teachSkills, learnSkills: user.learnSkills });
};

