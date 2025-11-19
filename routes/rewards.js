const express = require('express');
const {
  getRewardDashboard,
  getReferralHistory,
  getRewardHistory,
  trackReferralVisit,
} = require('../controllers/rewardController');
const { protect } = require('../middleware/auth');

const router = express.Router();

// Public endpoint to track referral clicks/visits
router.post('/track', trackReferralVisit);

// All routes below require authentication
router.use(protect);

router.get('/dashboard', getRewardDashboard);
router.get('/referrals', getReferralHistory);
router.get('/history', getRewardHistory);

module.exports = router;


