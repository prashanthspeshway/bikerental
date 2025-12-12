import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.js';
import connectDB from '../config/database.js';

dotenv.config();

const defaultUsers = [
  {
    name: 'Admin User',
    email: 'admin@bikerental.com',
    password: 'admin123',
    role: 'admin',
    walletBalance: 1000,
  },
  {
    name: 'John Doe',
    email: 'john@example.com',
    password: 'user123',
    role: 'user',
    walletBalance: 50,
  },
  {
    name: 'Jane Smith',
    email: 'jane@example.com',
    password: 'user123',
    role: 'user',
    walletBalance: 75,
  },
  {
    name: 'Bob Wilson',
    email: 'bob@example.com',
    password: 'user123',
    role: 'user',
    walletBalance: 25,
  },
];

async function seedUsers() {
  try {
    await connectDB();
    
    // Clear existing users (optional - comment out if you want to keep existing users)
    // await User.deleteMany({});
    // console.log('Cleared existing users');

    // Check if users already exist
    const existingUsers = await User.find({ email: { $in: defaultUsers.map(u => u.email) } });
    if (existingUsers.length > 0) {
      console.log('⚠️  Some users already exist. Skipping seed.');
      console.log('Existing users:', existingUsers.map(u => u.email).join(', '));
      process.exit(0);
    }

    // Create users (password will be hashed by the pre-save hook)
    const createdUsers = [];
    for (const userData of defaultUsers) {
      const user = new User(userData);
      await user.save();
      createdUsers.push(user);
      console.log(`✅ Created ${userData.role}: ${userData.email} (password: ${userData.password})`);
    }

    console.log(`\n✅ Seeded ${createdUsers.length} users`);
    console.log('\n📋 Login Credentials:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Admin:');
    console.log('  Email: admin@bikerental.com');
    console.log('  Password: admin123');
    console.log('\nUsers:');
    defaultUsers.filter(u => u.role === 'user').forEach(u => {
      console.log(`  Email: ${u.email}`);
      console.log(`  Password: user123`);
    });
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    process.exit(0);
  } catch (error) {
    console.error('Error seeding users:', error);
    process.exit(1);
  }
}

seedUsers();

