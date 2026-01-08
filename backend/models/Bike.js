import mongoose from 'mongoose';

const pricingSlabSchema = new mongoose.Schema({
  price: { type: Number, required: true },
  duration_min: { type: Number, required: true }, // in hours
  duration_max: { type: Number, required: true }, // in hours
  included_km: { type: Number, required: true },
  extra_km_price: { type: Number, required: true, default: 0 },
  minimum_booking_rule: { type: String, enum: ['none', 'min_duration', 'min_price'], default: 'none' },
  minimum_value: { type: Number, default: 0 }, // min duration in hours or min price
}, { _id: false });

const bikeSchema = new mongoose.Schema({
  name: { type: String, required: true },
  type: { type: String, enum: ['fuel', 'electric', 'scooter'], required: true },
  category: { type: String, enum: ['budget', 'midrange', 'topend'], default: 'midrange' },
  brand: { type: String, default: '' },
  image: { type: String, default: '/bikes/default.jpg' },
  // Legacy fields for backward compatibility
  pricePerHour: { type: Number },
  // New pricing fields
  price12Hours: { type: Number },
  // 12-hour pricing blocks for 7 days (14 blocks × 12 hours = 168 hours = 7 days)
  // Block 1: Hours 13-24, Block 2: Hours 25-36, ..., Block 14: Hours 157-168
  priceBlock1: { type: Number },
  priceBlock2: { type: Number },
  priceBlock3: { type: Number },
  priceBlock4: { type: Number },
  priceBlock5: { type: Number },
  priceBlock6: { type: Number },
  priceBlock7: { type: Number },
  priceBlock8: { type: Number },
  priceBlock9: { type: Number },
  priceBlock10: { type: Number },
  priceBlock11: { type: Number },
  priceBlock12: { type: Number },
  priceBlock13: { type: Number },
  priceBlock14: { type: Number },
  pricePerWeek: { type: Number },
  kmLimit: { type: Number },
  // New pricing model
  pricingSlabs: {
    hourly: { type: pricingSlabSchema },
    daily: { type: pricingSlabSchema },
    weekly: { type: pricingSlabSchema },
  },
  available: { type: Boolean, default: true },
  description: { type: String, default: '' },
  features: [{ type: String }],
  locationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Location',
    required: true,
  },
  // Weekend surge pricing multiplier (configurable per bike or global)
  weekendSurgeMultiplier: { type: Number, default: 1.0, min: 1.0 },
  // GST percentage (can be overridden per bike, defaults to 18%)
  gstPercentage: { type: Number, default: 18.0, min: 0, max: 100 },
}, { timestamps: true });

export default mongoose.model('Bike', bikeSchema);

