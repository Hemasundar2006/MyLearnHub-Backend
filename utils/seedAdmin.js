const User = require('../models/User');

// Seed default admin user
const seedAdmin = async () => {
  try {
    // Check if admin already exists
    const adminExists = await User.findOne({ 
      email: process.env.ADMIN_EMAIL || 'admin@mylearnhub.com' 
    });

    if (adminExists) {
      console.log('Admin user already exists');
      return;
    }

    // Create default admin
    const admin = await User.create({
      name: 'Admin User',
      email: process.env.ADMIN_EMAIL || 'admin@mylearnhub.com',
      password: process.env.ADMIN_PASSWORD || 'Admin@123',
      role: 'admin',
      avatar: 'https://ui-avatars.com/api/?name=Admin&background=667eea',
      coins: 10000, // Admin starts with 10,000 coins
      coinTransactions: [{
        amount: 10000,
        type: 'bonus',
        reason: 'Initial admin coin allocation',
        timestamp: new Date(),
      }],
    });

    console.log('✅ Default admin user created successfully');
    console.log(`Email: ${admin.email}`);
  } catch (error) {
    console.error('Error seeding admin:', error.message);
  }
};

module.exports = seedAdmin;

