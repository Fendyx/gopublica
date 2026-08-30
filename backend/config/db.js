const mongoose = require('mongoose');

/**
 * Connect to MongoDB.
 * @returns {Promise<void>}
 */
module.exports = async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ MongoDB connected');
  } catch (err) {
    console.error('❌ DB error:', err);
    process.exit(1);
  }
};
