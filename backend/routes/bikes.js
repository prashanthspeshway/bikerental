import express from 'express';
import Bike from '../models/Bike.js';
import { authenticateToken } from './auth.js';
import User from '../models/User.js';

const router = express.Router();

// Get all bikes
router.get('/', async (req, res) => {
  try {
    const bikes = await Bike.find();
    res.json(bikes);
  } catch (error) {
    console.error('Get bikes error:', error);
    res.status(500).json({ message: 'Error fetching bikes' });
  }
});

// Get bike by ID
router.get('/:id', async (req, res) => {
  try {
    const bike = await Bike.findById(req.params.id);
    if (!bike) {
      return res.status(404).json({ message: 'Bike not found' });
    }
    res.json(bike);
  } catch (error) {
    console.error('Get bike error:', error);
    res.status(500).json({ message: 'Error fetching bike' });
  }
});

// Create bike (admin only)
router.post('/', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }

    const { name, type, image, pricePerHour, kmLimit, description, features } = req.body;

    if (!name || !type || !pricePerHour || !kmLimit) {
      return res.status(400).json({ message: 'Required fields missing' });
    }

    const newBike = new Bike({
      name,
      type,
      image: image || '/bikes/default.jpg',
      pricePerHour: parseFloat(pricePerHour),
      kmLimit: parseInt(kmLimit),
      available: true,
      description: description || '',
      features: features || []
    });

    await newBike.save();
    res.status(201).json(newBike);
  } catch (error) {
    console.error('Create bike error:', error);
    res.status(500).json({ message: 'Error creating bike' });
  }
});

// Update bike (admin only)
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user || user.role !== 'admin') {
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

    res.json(bike);
  } catch (error) {
    console.error('Update bike error:', error);
    res.status(500).json({ message: 'Error updating bike' });
  }
});

// Delete bike (admin only)
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user || user.role !== 'admin') {
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
