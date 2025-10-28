const mongoose = require('mongoose');
const User = require('../models/User');
require('dotenv').config();

const createAdmin = async () => {
  try {
    // Connect to database
    await mongoose.connect(process.env.MONGO_URI || 'mongodb+srv://hemasundar:hemasundar123@cluster0.6qj8x.mongodb.net/mylearnhub?retryWrites=true&w=majority');
    console.log('Connected to database');

    // Find or create admin user
    let admin = await User.findOne({ email: 'admin@mylearnhub.com' });
    
    if (admin) {
      // Update existing user to admin
      admin.role = 'admin';
      admin.coins = 10000;
      admin.coinTransactions = [{
        amount: 10000,
        type: 'bonus',
        reason: 'Initial admin coin allocation',
        timestamp: new Date(),
      }];
      await admin.save();
      console.log('✅ Existing user updated to admin with 10,000 coins');
    } else {
      // Create new admin user
      admin = await User.create({
        name: 'Admin User',
        email: 'admin@mylearnhub.com',
        password: 'Admin@123',
        role: 'admin',
        avatar: 'https://ui-avatars.com/api/?name=Admin&background=667eea',
        coins: 10000,
        coinTransactions: [{
          amount: 10000,
          type: 'bonus',
          reason: 'Initial admin coin allocation',
          timestamp: new Date(),
        }],
      });
      console.log('✅ New admin user created with 10,000 coins');
    }
    
    console.log(`Admin ID: ${admin._id}`);
    console.log(`Admin coins: ${admin.coins}`);
    
  } catch (error) {
    console.error('Error creating/updating admin:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from database');
  }
};

createAdmin();
