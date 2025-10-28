const mongoose = require('mongoose');
const User = require('../models/User');
require('dotenv').config();

const updateAdminCoins = async () => {
  try {
    // Connect to database
    await mongoose.connect(process.env.MONGO_URI || '');
    console.log('Connected to database');

    // Find admin user
    const admin = await User.findOne({ role: 'admin' });
    
    if (!admin) {
      console.log('No admin user found');
      return;
    }

    console.log(`Current admin coins: ${admin.coins}`);

    // Update admin coins to 10,000
    admin.coins = 10000;
    
    // Add transaction record if not already exists
    const hasInitialTransaction = admin.coinTransactions.some(
      transaction => transaction.reason === 'Initial admin coin allocation'
    );

    if (!hasInitialTransaction) {
      admin.coinTransactions.push({
        amount: 10000,
        type: 'bonus',
        reason: 'Initial admin coin allocation',
        timestamp: new Date(),
      });
    }

    await admin.save();
    console.log('✅ Admin coins updated to 10,000');
    console.log(`New admin coins: ${admin.coins}`);
    
  } catch (error) {
    console.error('Error updating admin coins:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from database');
  }
};

updateAdminCoins();
