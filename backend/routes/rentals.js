import express from 'express';
import { authenticateToken } from './auth.js';
import Rental from '../models/Rental.js';
import Bike from '../models/Bike.js';
import User from '../models/User.js';
import { transformRental } from '../utils/transform.js';

const router = express.Router();

// Get all rentals (user sees their own, admin sees all)
router.get('/', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    let query = {};
    
    if (user.role !== 'admin') {
      query.userId = req.user.userId;
    }

    const rentals = await Rental.find(query)
      .populate('bikeId', 'name type image')
      .populate('userId', 'name email')
      .sort({ createdAt: -1 });

    // Transform _id to id for frontend compatibility
    const transformedRentals = rentals.map(transformRental);
    res.json(transformedRentals);
  } catch (error) {
    console.error('Get rentals error:', error);
    res.status(500).json({ message: 'Error fetching rentals' });
  }
});

// Get rental by ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const rental = await Rental.findById(req.params.id)
      .populate('bikeId')
      .populate('userId', 'name email');

    if (!rental) {
      return res.status(404).json({ message: 'Rental not found' });
    }

    const user = await User.findById(req.user.userId);
    if (user.role !== 'admin' && rental.userId._id.toString() !== req.user.userId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Transform _id to id for frontend compatibility
    res.json(transformRental(rental));
  } catch (error) {
    console.error('Get rental error:', error);
    res.status(500).json({ message: 'Error fetching rental' });
  }
});

// Create rental
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { bikeId, startTime } = req.body;

    if (!bikeId) {
      return res.status(400).json({ message: 'Bike ID is required' });
    }

    const bike = await Bike.findById(bikeId);
    if (!bike) {
      return res.status(404).json({ message: 'Bike not found' });
    }

    if (!bike.available) {
      return res.status(400).json({ message: 'Bike is not available' });
    }

    // Check if user has active rental
    const activeRental = await Rental.findOne({
      userId: req.user.userId,
      status: 'active'
    });

    if (activeRental) {
      return res.status(400).json({ message: 'You already have an active rental' });
    }

    // Check user wallet balance
    const user = await User.findById(req.user.userId);
    if (user.walletBalance < bike.pricePerHour) {
      return res.status(400).json({ message: 'Insufficient wallet balance' });
    }

    // Create rental
    const newRental = new Rental({
      bikeId,
      userId: req.user.userId,
      startTime: startTime || new Date(),
      status: 'active'
    });

    await newRental.save();

    // Mark bike as unavailable
    bike.available = false;
    await bike.save();

    // Transform _id to id for frontend compatibility
    res.status(201).json(transformRental(newRental));
  } catch (error) {
    console.error('Create rental error:', error);
    res.status(500).json({ message: 'Error creating rental' });
  }
});

// End rental
router.post('/:id/end', authenticateToken, async (req, res) => {
  try {
    const rental = await Rental.findById(req.params.id).populate('bikeId');
    if (!rental) {
      return res.status(404).json({ message: 'Rental not found' });
    }

    const user = await User.findById(req.user.userId);
    if (user.role !== 'admin' && rental.userId.toString() !== req.user.userId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    if (rental.status !== 'active') {
      return res.status(400).json({ message: 'Rental is not active' });
    }

    // Calculate cost
    const startTime = new Date(rental.startTime);
    const endTime = new Date();
    const hours = Math.ceil((endTime - startTime) / (1000 * 60 * 60));
    const totalCost = hours * rental.bikeId.pricePerHour;

    // Update rental
    rental.endTime = endTime;
    rental.totalCost = totalCost;
    rental.status = 'completed';
    await rental.save();

    // Deduct from wallet
    user.walletBalance -= totalCost;
    if (user.walletBalance < 0) {
      user.walletBalance = 0;
    }
    await user.save();

    // Mark bike as available
    rental.bikeId.available = true;
    await rental.bikeId.save();

    res.json(rental);
  } catch (error) {
    console.error('End rental error:', error);
    res.status(500).json({ message: 'Error ending rental' });
  }
});

// Cancel rental
router.post('/:id/cancel', authenticateToken, async (req, res) => {
  try {
    const rental = await Rental.findById(req.params.id).populate('bikeId');
    if (!rental) {
      return res.status(404).json({ message: 'Rental not found' });
    }

    const user = await User.findById(req.user.userId);
    if (user.role !== 'admin' && rental.userId.toString() !== req.user.userId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    if (rental.status !== 'active') {
      return res.status(400).json({ message: 'Rental is not active' });
    }

    // Update rental
    rental.endTime = new Date();
    rental.status = 'cancelled';
    await rental.save();

    // Mark bike as available
    rental.bikeId.available = true;
    await rental.bikeId.save();

    res.json(rental);
  } catch (error) {
    console.error('Cancel rental error:', error);
    res.status(500).json({ message: 'Error cancelling rental' });
  }
});

export default router;
