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
    
    if (!['admin', 'superadmin'].includes(user.role)) {
      query.userId = req.user.userId;
    }

    const rentals = await Rental.find(query)
      .populate('bikeId', 'name type image locationId')
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
    if (!['admin', 'superadmin'].includes(user.role) && rental.userId._id.toString() !== req.user.userId) {
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

    // Check if user has active/confirmed rental
    const activeRental = await Rental.findOne({
      userId: req.user.userId,
      status: { $in: ['confirmed', 'ongoing'] },
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
      status: 'ongoing'
    });

    await newRental.save();
    
    // Update bike availability
    bike.available = false;
    await bike.save();

    res.status(201).json(transformRental(newRental));
  } catch (error) {
    console.error('Create rental error:', error);
    res.status(500).json({ message: 'Error creating rental' });
  }
});

router.post('/:id/start', authenticateToken, async (req, res) => {
  try {
    const rental = await Rental.findById(req.params.id);
    if (!rental) return res.status(404).json({ message: 'Rental not found' });
    if (rental.status !== 'confirmed') return res.status(400).json({ message: 'Rental is not confirmed' });

    rental.status = 'ongoing';
    await rental.save();
    res.json(rental);
  } catch (error) {
    res.status(500).json({ message: 'Error starting ride' });
  }
});

router.post('/:id/complete', authenticateToken, async (req, res) => {
  try {
    const rental = await Rental.findById(req.params.id);
    if (!rental) return res.status(404).json({ message: 'Rental not found' });
    
    // Allow completing rides from both 'confirmed' and 'ongoing' statuses
    if (rental.status !== 'ongoing' && rental.status !== 'confirmed') {
      return res.status(400).json({ message: 'Rental must be confirmed or ongoing to complete' });
    }

    rental.status = 'completed';
    rental.endTime = new Date();
    if (!rental.dropoffTime) {
      rental.dropoffTime = new Date();
    }
    await rental.save();
    
    const bike = await Bike.findById(rental.bikeId);
    if (bike) {
      bike.available = true;
      await bike.save();
    }

    res.json(rental);
  } catch (error) {
    res.status(500).json({ message: 'Error completing ride' });
  }
});

router.post('/:id/cancel', authenticateToken, async (req, res) => {
  try {
    const rental = await Rental.findById(req.params.id);
    if (!rental) return res.status(404).json({ message: 'Rental not found' });
    if (rental.userId.toString() !== req.user.userId) return res.status(403).json({ message: 'Access denied' });
    if (rental.status !== 'confirmed') return res.status(400).json({ message: 'Cannot cancel this rental' });

    rental.status = 'cancelled';
    await rental.save();
    res.json({ message: 'Rental cancelled', rental });
  } catch (error) {
    res.status(500).json({ message: 'Error cancelling rental' });
  }
});

router.post('/:id/review', authenticateToken, async (req, res) => {
  try {
    const { rating, comment } = req.body;
    const rental = await Rental.findById(req.params.id);
    
    if (!rental) return res.status(404).json({ message: 'Rental not found' });
    if (rental.userId.toString() !== req.user.userId) return res.status(403).json({ message: 'Access denied' });
    if (rental.status !== 'completed') return res.status(400).json({ message: 'Rental must be completed to review' });

    const review = new Review({
      rentalId: rental._id,
      userId: req.user.userId,
      bikeId: rental.bikeId,
      rating,
      comment
    });

    await review.save();
    res.json(review);
  } catch (error) {
    console.error('Review error:', error);
    res.status(500).json({ message: 'Error submitting review' });
  }
});

export default router;
