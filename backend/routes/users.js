import express from 'express';
import { authenticateToken } from './auth.js';
import User from '../models/User.js';
import bcrypt from 'bcryptjs';
import { transformUser } from '../utils/transform.js';

const router = express.Router();

// Get all users (admin only)
router.get('/', authenticateToken, async (req, res) => {
  try {
    const currentUser = await User.findById(req.user.userId);
    if (!['admin', 'superadmin'].includes(currentUser.role)) {
      return res.status(403).json({ message: 'Admin access required' });
    }

    const users = await User.find().select('-password');
    // Transform _id to id for frontend compatibility
    const transformedUsers = users.map(transformUser);
    res.json(transformedUsers);
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

    if (!['admin', 'superadmin'].includes(currentUser.role) && req.params.id !== req.user.userId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Transform _id to id for frontend compatibility
    res.json(transformUser(targetUser));
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

    if (!['admin', 'superadmin'].includes(currentUser.role) && req.params.id !== req.user.userId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const { 
      name, 
      email, 
      password, 
      walletBalance,
      mobile,
      emergencyContact,
      familyContact,
      permanentAddress,
      currentAddress,
      hotelStay,
      isVerified,
      role
    } = req.body;

    if (name !== undefined) user.name = name;
    if (email !== undefined) user.email = email;
    if (mobile !== undefined) user.mobile = mobile;
    if (emergencyContact !== undefined) user.emergencyContact = emergencyContact;
    if (familyContact !== undefined) user.familyContact = familyContact;
    if (permanentAddress !== undefined) user.permanentAddress = permanentAddress;
    if (currentAddress !== undefined) user.currentAddress = currentAddress;
    if (hotelStay !== undefined) user.hotelStay = hotelStay;
    if (walletBalance !== undefined && ['admin', 'superadmin'].includes(currentUser.role)) {
      user.walletBalance = parseFloat(walletBalance);
    }
    if (isVerified !== undefined && ['admin', 'superadmin'].includes(currentUser.role)) {
      user.isVerified = Boolean(isVerified);
    }
    if (role !== undefined) {
      if (currentUser.role !== 'superadmin') {
        return res.status(403).json({ message: 'Only superadmin can change roles' });
      }
      const allowedRoles = ['user', 'admin'];
      if (!allowedRoles.includes(role)) {
        return res.status(400).json({ message: 'Invalid role' });
      }
      user.role = role;
    }

    if (password) {
      user.password = await bcrypt.hash(password, 10);
    }

    await user.save();
    // Transform _id to id for frontend compatibility
    res.json(transformUser(user));
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

    if (!['admin', 'superadmin'].includes(currentUser.role) && req.params.id !== req.user.userId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    user.walletBalance += parseFloat(amount);
    await user.save();

    // Transform _id to id for frontend compatibility
    res.json(transformUser(user));
  } catch (error) {
    console.error('Top up error:', error);
    res.status(500).json({ message: 'Error topping up wallet' });
  }
});

// Create admin (superadmin only)
router.post('/create-admin', authenticateToken, async (req, res) => {
  try {
    const currentUser = await User.findById(req.user.userId);
    if (!currentUser || currentUser.role !== 'superadmin') {
      return res.status(403).json({ message: 'Superadmin access required' });
    }
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email and password are required' });
    }
    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({ message: 'User already exists' });
    }
    const newUser = new User({
      email,
      name,
      password,
      role: 'admin',
      walletBalance: 10,
      documents: [],
    });
    await newUser.save();
    res.status(201).json(transformUser(newUser));
  } catch (error) {
    console.error('Create admin error:', error);
    res.status(500).json({ message: 'Error creating admin' });
  }
});

export default router;
