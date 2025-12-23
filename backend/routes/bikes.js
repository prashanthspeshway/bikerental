import express from 'express';
import Bike from '../models/Bike.js';
import { authenticateToken } from './auth.js';
import User from '../models/User.js';
import { transformBike } from '../utils/transform.js';
import Rental from '../models/Rental.js';

const router = express.Router();

// Get all bikes (optionally filter by location)
router.get('/', async (req, res) => {
  try {
    const { locationId } = req.query;
    let query = {};
    if (locationId) {
      query.locationId = locationId;
    }
    const bikes = await Bike.find(query).populate('locationId', 'name city state');
    // Transform _id to id for frontend compatibility
    const transformedBikes = bikes.map(transformBike);
    res.json(transformedBikes);
  } catch (error) {
    console.error('Get bikes error:', error);
    res.status(500).json({ message: 'Error fetching bikes' });
  }
});

// Get available bikes for a time window
router.get('/available', async (req, res) => {
  try {
    const { start, end, locationId } = req.query;
    if (!start || !end) {
      return res.status(400).json({ message: 'start and end query params are required (ISO dates)' });
    }
    const startTime = new Date(start);
    const endTime = new Date(end);
    if (isNaN(startTime.getTime()) || isNaN(endTime.getTime()) || endTime <= startTime) {
      return res.status(400).json({ message: 'Invalid time range' });
    }

    const rentals = await Rental.find({
      status: { $in: ['confirmed', 'ongoing'] },
    }).select('bikeId startTime endTime pickupTime dropoffTime status');

    const occupiedBikeIds = new Set(
      rentals
        .filter((r) => {
          const rentalStart = r.pickupTime || r.startTime;
          if (!rentalStart) return false;

          const rentalEnd = r.dropoffTime || r.endTime || (r.status === 'ongoing' ? new Date(8640000000000000) : null);
          if (!rentalEnd) return rentalStart < endTime;

          return rentalStart < endTime && rentalEnd > startTime;
        })
        .map((r) => r.bikeId.toString())
    );

    const query = {};
    if (locationId) query.locationId = locationId;

    const bikes = await Bike.find(query).populate('locationId', 'name city state');
    const available = bikes.filter(b => !occupiedBikeIds.has(b._id.toString()));
    res.json(available.map(transformBike));
  } catch (error) {
    console.error('Get available bikes error:', error);
    res.status(500).json({ message: 'Error fetching available bikes' });
  }
});

// Get bike by ID
router.get('/:id', async (req, res) => {
  try {
    const bike = await Bike.findById(req.params.id);
    if (!bike) {
      return res.status(404).json({ message: 'Bike not found' });
    }
    // Transform _id to id for frontend compatibility
    res.json(transformBike(bike));
  } catch (error) {
    console.error('Get bike error:', error);
    res.status(500).json({ message: 'Error fetching bike' });
  }
});

// Create bike (admin only)
router.post('/', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user || !['admin', 'superadmin'].includes(user.role)) {
      return res.status(403).json({ message: 'Admin access required' });
    }

    const { name, type, brand, image, pricePerHour, kmLimit, description, features, locationId } = req.body;

    if (!name || !type || !pricePerHour || !kmLimit || !locationId) {
      return res.status(400).json({ message: 'Required fields missing' });
    }

    const newBike = new Bike({
      name,
      type,
      brand: brand || '',
      image: image || '/bikes/default.jpg',
      pricePerHour: parseFloat(pricePerHour),
      kmLimit: parseInt(kmLimit),
      available: true,
      description: description || '',
      features: features || [],
      locationId
    });

    await newBike.save();
    // Transform _id to id for frontend compatibility
    res.status(201).json(transformBike(newBike));
  } catch (error) {
    console.error('Create bike error:', error);
    res.status(500).json({ message: 'Error creating bike' });
  }
});

// Update bike (admin only)
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user || !['admin', 'superadmin'].includes(user.role)) {
      return res.status(403).json({ message: 'Admin access required' });
    }

    const bike = await Bike.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!bike) {
      return res.status(404).json({ message: 'Bike not found' });
    }

    // Transform _id to id for frontend compatibility
    res.json(transformBike(bike));
  } catch (error) {
    console.error('Update bike error:', error);
    res.status(500).json({ message: 'Error updating bike' });
  }
});

// Delete bike (admin only)
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user || !['admin', 'superadmin'].includes(user.role)) {
      return res.status(403).json({ message: 'Admin access required' });
    }

    const bike = await Bike.findByIdAndDelete(req.params.id);
    if (!bike) {
      return res.status(404).json({ message: 'Bike not found' });
    }

    res.json({ message: 'Bike deleted successfully' });
  } catch (error) {
    console.error('Delete bike error:', error);
    res.status(500).json({ message: 'Error deleting bike' });
  }
});

export default router;
