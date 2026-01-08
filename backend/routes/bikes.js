import express from 'express';
import Bike from '../models/Bike.js';
import { authenticateToken } from './auth.js';
import User from '../models/User.js';
import { transformBike } from '../utils/transform.js';
import Rental from '../models/Rental.js';
import { logErrorIfNotConnection } from '../utils/errorHandler.js';

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
    logErrorIfNotConnection('Get bikes error', error);
    res.status(500).json({ message: 'Error fetching bikes. Please try again later.' });
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
    logErrorIfNotConnection('Get available bikes error', error);
    res.status(500).json({ message: 'Error fetching available bikes. Please try again later.' });
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
    logErrorIfNotConnection('Get bike error', error);
    res.status(500).json({ message: 'Error fetching bike. Please try again later.' });
  }
});

// Create bike (admin only)
router.post('/', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user || !['admin', 'superadmin'].includes(user.role)) {
      return res.status(403).json({ message: 'Admin access required' });
    }

    const { 
      name, 
      type, 
      brand, 
      category,
      image, 
      pricePerHour, 
      kmLimit, 
      description, 
      features, 
      locationId,
      pricingSlabs,
      weekendSurgeMultiplier,
      gstPercentage,
      price12Hours,
      pricePerHourOver12,
      pricePerWeek,
      priceBlock1,
      priceBlock2,
      priceBlock3,
      priceBlock4,
      priceBlock5,
      priceBlock6,
      priceBlock7,
      priceBlock8,
      priceBlock9,
      priceBlock10,
      priceBlock11,
      priceBlock12,
      priceBlock13,
      priceBlock14
    } = req.body;

    if (!name || !type || !locationId) {
      return res.status(400).json({ message: 'Required fields missing: name, type, locationId' });
    }

    // Validate that either pricingSlabs or legacy pricePerHour/kmLimit is provided
    const hasPricingSlabs = pricingSlabs && (
      pricingSlabs.hourly || 
      pricingSlabs.daily || 
      pricingSlabs.weekly
    );
    const hasLegacyPricing = pricePerHour && kmLimit;

    if (!hasPricingSlabs && !hasLegacyPricing) {
      return res.status(400).json({ 
        message: 'Either pricingSlabs or pricePerHour/kmLimit must be provided' 
      });
    }

    const newBike = new Bike({
      name,
      type,
      brand: brand || '',
      category: category || 'midrange',
      image: image || '/bikes/default.jpg',
      // Legacy fields (optional if pricingSlabs provided)
      pricePerHour: pricePerHour ? parseFloat(pricePerHour) : undefined,
      kmLimit: kmLimit ? parseInt(kmLimit) : undefined,
      // New simple pricing model - handle null, 0, and empty strings correctly
      price12Hours: (price12Hours !== null && price12Hours !== '' && !isNaN(parseFloat(price12Hours))) 
        ? parseFloat(price12Hours) 
        : (price12Hours === null ? null : undefined),
      pricePerHourOver12: (pricePerHourOver12 !== null && pricePerHourOver12 !== '' && !isNaN(parseFloat(pricePerHourOver12))) 
        ? parseFloat(pricePerHourOver12) 
        : (pricePerHourOver12 === null ? null : undefined),
      pricePerWeek: (pricePerWeek !== null && pricePerWeek !== '' && !isNaN(parseFloat(pricePerWeek))) 
        ? parseFloat(pricePerWeek) 
        : (pricePerWeek === null ? null : undefined),
      priceBlock1: (priceBlock1 !== null && priceBlock1 !== '' && !isNaN(parseFloat(priceBlock1))) 
        ? parseFloat(priceBlock1) 
        : (priceBlock1 === null ? null : undefined),
      priceBlock2: (priceBlock2 !== null && priceBlock2 !== '' && !isNaN(parseFloat(priceBlock2))) 
        ? parseFloat(priceBlock2) 
        : (priceBlock2 === null ? null : undefined),
      priceBlock3: (priceBlock3 !== null && priceBlock3 !== '' && !isNaN(parseFloat(priceBlock3))) 
        ? parseFloat(priceBlock3) 
        : (priceBlock3 === null ? null : undefined),
      priceBlock4: (priceBlock4 !== null && priceBlock4 !== '' && !isNaN(parseFloat(priceBlock4))) 
        ? parseFloat(priceBlock4) 
        : (priceBlock4 === null ? null : undefined),
      priceBlock5: (priceBlock5 !== null && priceBlock5 !== '' && !isNaN(parseFloat(priceBlock5))) 
        ? parseFloat(priceBlock5) 
        : (priceBlock5 === null ? null : undefined),
      priceBlock6: (priceBlock6 !== null && priceBlock6 !== '' && !isNaN(parseFloat(priceBlock6))) 
        ? parseFloat(priceBlock6) 
        : (priceBlock6 === null ? null : undefined),
      priceBlock7: (priceBlock7 !== null && priceBlock7 !== '' && !isNaN(parseFloat(priceBlock7))) 
        ? parseFloat(priceBlock7) 
        : (priceBlock7 === null ? null : undefined),
      priceBlock8: (priceBlock8 !== null && priceBlock8 !== '' && !isNaN(parseFloat(priceBlock8))) 
        ? parseFloat(priceBlock8) 
        : (priceBlock8 === null ? null : undefined),
      priceBlock9: (priceBlock9 !== null && priceBlock9 !== '' && !isNaN(parseFloat(priceBlock9))) 
        ? parseFloat(priceBlock9) 
        : (priceBlock9 === null ? null : undefined),
      priceBlock10: (priceBlock10 !== null && priceBlock10 !== '' && !isNaN(parseFloat(priceBlock10))) 
        ? parseFloat(priceBlock10) 
        : (priceBlock10 === null ? null : undefined),
      priceBlock11: (priceBlock11 !== null && priceBlock11 !== '' && !isNaN(parseFloat(priceBlock11))) 
        ? parseFloat(priceBlock11) 
        : (priceBlock11 === null ? null : undefined),
      priceBlock12: (priceBlock12 !== null && priceBlock12 !== '' && !isNaN(parseFloat(priceBlock12))) 
        ? parseFloat(priceBlock12) 
        : (priceBlock12 === null ? null : undefined),
      priceBlock13: (priceBlock13 !== null && priceBlock13 !== '' && !isNaN(parseFloat(priceBlock13))) 
        ? parseFloat(priceBlock13) 
        : (priceBlock13 === null ? null : undefined),
      priceBlock14: (priceBlock14 !== null && priceBlock14 !== '' && !isNaN(parseFloat(priceBlock14))) 
        ? parseFloat(priceBlock14) 
        : (priceBlock14 === null ? null : undefined),
      // New pricing model
      pricingSlabs: pricingSlabs || undefined,
      weekendSurgeMultiplier: weekendSurgeMultiplier || 1.0,
      gstPercentage: gstPercentage || 18.0,
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

    // Extract fields from request body
    const {
      name,
      type,
      brand,
      category,
      image,
      pricePerHour,
      kmLimit,
      description,
      features,
      locationId,
      pricingSlabs,
      weekendSurgeMultiplier,
      gstPercentage,
      available,
      price12Hours,
      pricePerHourOver12,
      pricePerWeek,
      priceBlock1,
      priceBlock2,
      priceBlock3,
      priceBlock4,
      priceBlock5,
      priceBlock6,
      priceBlock7,
      priceBlock8,
      priceBlock9,
      priceBlock10,
      priceBlock11,
      priceBlock12,
      priceBlock13,
      priceBlock14
    } = req.body;

    // Build update object with only provided fields
    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (type !== undefined) updateData.type = type;
    if (brand !== undefined) updateData.brand = brand;
    if (category !== undefined) updateData.category = category;
    if (image !== undefined) updateData.image = image;
    if (pricePerHour !== undefined) updateData.pricePerHour = parseFloat(pricePerHour);
    if (kmLimit !== undefined) updateData.kmLimit = parseInt(kmLimit);
    if (description !== undefined) updateData.description = description;
    if (features !== undefined) updateData.features = features;
    if (locationId !== undefined) updateData.locationId = locationId;
    if (pricingSlabs !== undefined) updateData.pricingSlabs = pricingSlabs;
    if (weekendSurgeMultiplier !== undefined) updateData.weekendSurgeMultiplier = weekendSurgeMultiplier;
    if (gstPercentage !== undefined) updateData.gstPercentage = gstPercentage;
    if (available !== undefined) updateData.available = available;
    // New simple pricing model fields - handle null, 0, and empty strings correctly
    if (price12Hours !== undefined) {
      updateData.price12Hours = (price12Hours !== null && price12Hours !== '' && !isNaN(parseFloat(price12Hours))) 
        ? parseFloat(price12Hours) 
        : null;
    }
    if (pricePerHourOver12 !== undefined) {
      updateData.pricePerHourOver12 = (pricePerHourOver12 !== null && pricePerHourOver12 !== '' && !isNaN(parseFloat(pricePerHourOver12))) 
        ? parseFloat(pricePerHourOver12) 
        : null;
    }
    if (pricePerWeek !== undefined) {
      updateData.pricePerWeek = (pricePerWeek !== null && pricePerWeek !== '' && !isNaN(parseFloat(pricePerWeek))) 
        ? parseFloat(pricePerWeek) 
        : null;
    }
    if (priceBlock1 !== undefined) {
      updateData.priceBlock1 = (priceBlock1 !== null && priceBlock1 !== '' && !isNaN(parseFloat(priceBlock1))) 
        ? parseFloat(priceBlock1) 
        : null;
    }
    if (priceBlock2 !== undefined) {
      updateData.priceBlock2 = (priceBlock2 !== null && priceBlock2 !== '' && !isNaN(parseFloat(priceBlock2))) 
        ? parseFloat(priceBlock2) 
        : null;
    }
    if (priceBlock3 !== undefined) {
      updateData.priceBlock3 = (priceBlock3 !== null && priceBlock3 !== '' && !isNaN(parseFloat(priceBlock3))) 
        ? parseFloat(priceBlock3) 
        : null;
    }
    if (priceBlock4 !== undefined) {
      updateData.priceBlock4 = (priceBlock4 !== null && priceBlock4 !== '' && !isNaN(parseFloat(priceBlock4))) 
        ? parseFloat(priceBlock4) 
        : null;
    }
    if (priceBlock5 !== undefined) {
      updateData.priceBlock5 = (priceBlock5 !== null && priceBlock5 !== '' && !isNaN(parseFloat(priceBlock5))) 
        ? parseFloat(priceBlock5) 
        : null;
    }
    if (priceBlock6 !== undefined) {
      updateData.priceBlock6 = (priceBlock6 !== null && priceBlock6 !== '' && !isNaN(parseFloat(priceBlock6))) 
        ? parseFloat(priceBlock6) 
        : null;
    }
    if (priceBlock7 !== undefined) {
      updateData.priceBlock7 = (priceBlock7 !== null && priceBlock7 !== '' && !isNaN(parseFloat(priceBlock7))) 
        ? parseFloat(priceBlock7) 
        : null;
    }
    if (priceBlock8 !== undefined) {
      updateData.priceBlock8 = (priceBlock8 !== null && priceBlock8 !== '' && !isNaN(parseFloat(priceBlock8))) 
        ? parseFloat(priceBlock8) 
        : null;
    }
    if (priceBlock9 !== undefined) {
      updateData.priceBlock9 = (priceBlock9 !== null && priceBlock9 !== '' && !isNaN(parseFloat(priceBlock9))) 
        ? parseFloat(priceBlock9) 
        : null;
    }
    if (priceBlock10 !== undefined) {
      updateData.priceBlock10 = (priceBlock10 !== null && priceBlock10 !== '' && !isNaN(parseFloat(priceBlock10))) 
        ? parseFloat(priceBlock10) 
        : null;
    }
    if (priceBlock11 !== undefined) {
      updateData.priceBlock11 = (priceBlock11 !== null && priceBlock11 !== '' && !isNaN(parseFloat(priceBlock11))) 
        ? parseFloat(priceBlock11) 
        : null;
    }
    if (priceBlock12 !== undefined) {
      updateData.priceBlock12 = (priceBlock12 !== null && priceBlock12 !== '' && !isNaN(parseFloat(priceBlock12))) 
        ? parseFloat(priceBlock12) 
        : null;
    }
    if (priceBlock13 !== undefined) {
      updateData.priceBlock13 = (priceBlock13 !== null && priceBlock13 !== '' && !isNaN(parseFloat(priceBlock13))) 
        ? parseFloat(priceBlock13) 
        : null;
    }
    if (priceBlock14 !== undefined) {
      updateData.priceBlock14 = (priceBlock14 !== null && priceBlock14 !== '' && !isNaN(parseFloat(priceBlock14))) 
        ? parseFloat(priceBlock14) 
        : null;
    }

    const bike = await Bike.findByIdAndUpdate(
      req.params.id,
      updateData,
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
