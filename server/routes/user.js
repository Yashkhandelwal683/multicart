import express from 'express';
import User from '../models/User.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

router.get('/current-user', authMiddleware, async (req, res) => {
  try {
    const user = await User.findOne({ email: req.user.email }).select('-password').populate('cart.product');
    if (!user) {
      return res.status(400).json({ message: 'User is not found' });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: `Get Current User error ${error.message}` });
  }
});

router.post('/edit-role-mobile', authMiddleware, async (req, res) => {
  try {
    const { role, phone } = req.body;
    const user = await User.findOneAndUpdate({ email: req.user.email }, { role, phone }, { new: true });
    if (!user) {
      return res.status(400).json({ message: 'user not found' });
    }
    res.json({ user });
  } catch (error) {
    res.status(500).json({ message: `edit role and mobile error ${error.message}` });
  }
});

router.post('/edit-user-profile', authMiddleware, async (req, res) => {
  try {
    const { name, phone, image } = req.body;
    const updateData = { name, phone };
    if (image) {
      updateData.image = image;
    }
    const user = await User.findByIdAndUpdate(req.user.id, updateData, { new: true });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: `Edit profile error ${error.message}` });
  }
});

export default router;
