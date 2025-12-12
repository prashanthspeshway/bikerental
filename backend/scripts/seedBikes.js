import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Bike from '../models/Bike.js';
import connectDB from '../config/database.js';

dotenv.config();

const defaultBikes = [
  {
    name: 'Thunder E-Bike',
    type: 'electric',
    image: '/bikes/electric-1.jpg',
    pricePerHour: 15,
    kmLimit: 30,
    available: true,
    description: 'Premium electric bike with powerful motor and long battery life.',
    features: ['500W Motor', 'LCD Display', '50km Range', 'LED Lights'],
  },
  {
    name: 'Trail Blazer MTB',
    type: 'mountain',
    image: '/bikes/mountain-1.jpg',
    pricePerHour: 12,
    kmLimit: 25,
    available: true,
    description: 'Rugged mountain bike built for off-road adventures.',
    features: ['21 Speed', 'Disc Brakes', 'Suspension Fork', 'Alloy Frame'],
  },
  {
    name: 'City Cruiser',
    type: 'city',
    image: '/bikes/city-1.jpg',
    pricePerHour: 8,
    kmLimit: 20,
    available: false,
    description: 'Comfortable city bike perfect for daily commutes.',
    features: ['Step-Through Frame', 'Basket', 'Bell', 'Rear Rack'],
  },
  {
    name: 'Velocity Sport',
    type: 'sport',
    image: '/bikes/sport-1.jpg',
    pricePerHour: 18,
    kmLimit: 40,
    available: true,
    description: 'High-performance sport bike for speed enthusiasts.',
    features: ['Carbon Frame', 'Aero Bars', '11 Speed', 'Clipless Pedals'],
  },
  {
    name: 'Eco Rider E-Bike',
    type: 'electric',
    image: '/bikes/electric-2.jpg',
    pricePerHour: 14,
    kmLimit: 35,
    available: true,
    description: 'Eco-friendly electric bike with regenerative braking.',
    features: ['350W Motor', 'Regen Brakes', '45km Range', 'USB Charger'],
  },
  {
    name: 'Urban Explorer',
    type: 'city',
    image: '/bikes/city-2.jpg',
    pricePerHour: 10,
    kmLimit: 25,
    available: true,
    description: 'Versatile urban bike with modern styling.',
    features: ['7 Speed', 'Fenders', 'Chain Guard', 'Kickstand'],
  },
];

async function seedBikes() {
  try {
    await connectDB();
    
    // Clear existing bikes
    await Bike.deleteMany({});
    console.log('Cleared existing bikes');

    // Insert default bikes
    await Bike.insertMany(defaultBikes);
    console.log(`✅ Seeded ${defaultBikes.length} bikes`);

    process.exit(0);
  } catch (error) {
    console.error('Error seeding bikes:', error);
    process.exit(1);
  }
}

seedBikes();

