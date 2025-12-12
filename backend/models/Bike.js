import mongoose from 'mongoose';

const bikeSchema = new mongoose.Schema({
  name: { type: String, required: true },
  type: { type: String, enum: ['electric', 'mountain', 'city', 'sport'], required: true },
  image: { type: String, default: '/bikes/default.jpg' },
  pricePerHour: { type: Number, required: true },
  kmLimit: { type: Number, required: true },
  available: { type: Boolean, default: true },
  description: { type: String, default: '' },
  features: [{ type: String }],
  locationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Location',
    required: true,
  },
}, { timestamps: true });

export default mongoose.model('Bike', bikeSchema);

