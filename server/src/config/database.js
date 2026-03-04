// Database connection module.
// Separated from index.js so that:
// 1. The DB technology (MongoDB) can be swapped in the future.
// 2. Tests can import the app without triggering a real DB connection.
// 3. Connection logic is centralized in one place.

const mongoose = require('mongoose');

const connectDB = async () => {
  const uri = process.env.MONGO_URI || 'mongodb://localhost:27017/coupon-marketplace';

  await mongoose.connect(uri);
  console.log('Connected to MongoDB');
};

module.exports = connectDB;
