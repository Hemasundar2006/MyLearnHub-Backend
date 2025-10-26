const dotenv = require('dotenv');
const connectDB = require('../config/db');
const seedNotifications = require('../utils/seedNotifications');

// Load environment variables
dotenv.config();

// Connect to database and seed
const runSeed = async () => {
  try {
    await connectDB();
    console.log('🔌 Connected to database');
    
    await seedNotifications();
    
    console.log('\n✅ Seeding completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
};

runSeed();

