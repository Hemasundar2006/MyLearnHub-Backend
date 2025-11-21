const express = require('express');
const router = express.Router();
const {
  getBadgeLeaderboard,
  getUserBadgeRank,
} = require('../controllers/leaderboardController');
const { protect } = require('../middleware/auth');

// Public routes
router.get('/badges', getBadgeLeaderboard);

// Protected routes
router.get('/badges/rank/:userId', protect, getUserBadgeRank);

module.exports = router;

