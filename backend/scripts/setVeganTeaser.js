require('dotenv').config();
const mongoose = require('mongoose');
const Branch = require('../models/Branch');

(async () => {
  await mongoose.connect(process.env.MONGO_URI); // проверь точное имя переменной в index.js
  const result = await Branch.updateOne(
    { _id: '6a757d39b07c4d4e9f46e800' },
    { $set: { 'settingsOverride.features': { hasVeganTeaser: true } } }
  );
  console.log('✅ Updated:', result);
  await mongoose.disconnect();
})();