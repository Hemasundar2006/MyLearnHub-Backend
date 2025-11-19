const mongoose = require('mongoose');
const User = require('../models/User');
require('dotenv').config();

const DEFAULT_STATS = {
  totalShares: 0,
  totalClicks: 0,
  successfulReferrals: 0,
  totalCoinsEarned: 0,
  lastReferralAt: null,
};

const getConnectionString = () =>
  process.env.MONGODB_URI || process.env.MONGO_URI || process.env.MONGO_URL;

const normalizeStats = (stats = {}) => ({
  totalShares: stats.totalShares || 0,
  totalClicks: stats.totalClicks || 0,
  successfulReferrals: stats.successfulReferrals || 0,
  totalCoinsEarned: stats.totalCoinsEarned || 0,
  lastReferralAt: stats.lastReferralAt || null,
});

const backfillReferralCodes = async () => {
  const uri = getConnectionString();

  if (!uri) {
    throw new Error(
      'Missing MongoDB connection string. Set MONGODB_URI in your environment.'
    );
  }

  await mongoose.connect(uri);
  console.log('✅ Connected to MongoDB');

  const query = {
    $or: [
      { referralCode: { $exists: false } },
      { referralCode: null },
      { referralCode: '' },
    ],
  };

  const users = await User.find(query).select('name email referralStats').lean();

  if (!users.length) {
    console.log('All users already have referral codes. Nothing to update.');
    return;
  }

  console.log(`Updating ${users.length} user(s) without referral codes...`);

  let updatedCount = 0;

  for (const user of users) {
    const newCode = await User.generateUniqueReferralCode(user.name);

    await User.updateOne(
      { _id: user._id },
      {
        $set: {
          referralCode: newCode,
          referralStats: normalizeStats(user.referralStats || DEFAULT_STATS),
        },
      }
    );

    updatedCount += 1;
    console.log(` - Assigned ${newCode} to ${user.email}`);
  }

  console.log(`🎉 Finished backfilling ${updatedCount} user(s).`);
};

backfillReferralCodes()
  .catch((error) => {
    console.error('Backfill referral codes error:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  });


