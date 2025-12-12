import express from 'express';
import { authenticateToken } from './auth.js';
import User from '../models/User.js';
import bcrypt from 'bcryptjs';

const router = express.Router();

// Get all users (admin only)
router.get('/', authenticateToken, async (req, res) => {
  try {
    const currentUser = await User.findById(req.user.userId);
    if (currentUser.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }

    const users = await User.find().select('-password');
    res.json(users);
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ message: 'Error fetching users' });
  }
});

// Get user by ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const currentUser = await User.findById(req.user.userId);
    const targetUser = await User.findById(req.params.id);

    if (!targetUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (currentUser.role !== 'admin' && req.params.id !== req.user.userId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json(targetUser.toJSON());
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ message: 'Error fetching user' });
  }
});

// Update user
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const currentUser = await User.findById(req.user.userId);
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (currentUser.role !== 'admin' && req.params.id !== req.user.userId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const { name, email, password, walletBalance } = req.body;

    if (name !== undefined) user.name = name;
    if (email !== undefined) user.email = email;
    if (walletBalance !== undefined && currentUser.role === 'admin') {
      user.walletBalance = parseFloat(walletBalance);
    }

    if (password) {
      user.password = await bcrypt.hash(password, 10);
    }

    await user.save();
    res.json(user.toJSON());
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ message: 'Error updating user' });
  }
});

// Top up wallet
router.post('/:id/wallet/topup', authenticateToken, async (req, res) => {
  try {
    const { amount } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ message: 'Valid amount is required' });
    }

    const currentUser = await User.findById(req.user.userId);
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (currentUser.role !== 'admin' && req.params.id !== req.user.userId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    user.walletBalance += parseFloat(amount);
    await user.save();

    res.json(user.toJSON());
  } catch (error) {
    console.error('Top up error:', error);
    res.status(500).json({ message: 'Error topping up wallet' });
  }
});

export default router;
