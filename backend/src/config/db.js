const mongoose = require('mongoose');

const connectDB = async () => {
  const uri = process.env.MONGO_URI;
  if (!uri) {
    console.error('MONGO_URI not set in environment');
    process.exit(1);
  }
  try {
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 2000
    });
    console.log('MongoDB connected to', uri);
  } catch (err) {
    console.log('Local MongoDB port 27017 not active. Fallback to in-memory MongoDB server...');
    try {
      const { MongoMemoryServer } = require('mongodb-memory-server');
      const mongoServer = await MongoMemoryServer.create();
      const memUri = mongoServer.getUri();
      await mongoose.connect(memUri);
      console.log('MongoDB connected (In-Memory) at', memUri);
    } catch (memErr) {
      console.error('MongoDB connection error:', memErr.message);
      process.exit(1);
    }
  }

  try {
    const User = require('../models/User');
    const count = await User.countDocuments();
    if (count === 0) {
      const bcrypt = require('bcryptjs');
      await User.create({
        name: 'Demo Admin',
        email: 'abc@gmail.com',
        epfNumber: 'EPF001',
        password: bcrypt.hashSync('ABC@123', 10),
        role: 'Admin'
      });
      console.log('Auto-seeded demo admin user: abc@gmail.com');
    }
  } catch (seedErr) {
    console.error('Auto-seed check error:', seedErr.message);
  }
};

module.exports = connectDB;
