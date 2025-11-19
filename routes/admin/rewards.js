const express = require('express');
const router = express.Router();
const {
  getRewardsOverview,
  getRewardUsers,
  getUserRewardDetails,
  getReferralEvents,
} = require('../../controllers/adminRewardController');
const { protect } = require('../../middleware/auth');
const { adminOnly } = require('../../middleware/admin');

router.use(protect);
router.use(adminOnly);

router.get('/overview', getRewardsOverview);
router.get('/users', getRewardUsers);
router.get('/users/:userId', getUserRewardDetails);
router.get('/referrals', getReferralEvents);

module.exports = router;


