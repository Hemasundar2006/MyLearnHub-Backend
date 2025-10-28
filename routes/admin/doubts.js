const express = require('express');
const router = express.Router();
const {
  getAllDoubts,
  getDoubtStats,
  answerDoubt,
  closeDoubt,
  getDoubtLeaderboard
} = require('../../controllers/adminDoubtController');
const { protect } = require('../../middleware/auth');
const { adminOnly } = require('../../middleware/admin');

// Admin doubt routes
router.get('/', protect, adminOnly, getAllDoubts);
router.get('/stats', protect, adminOnly, getDoubtStats);
router.get('/leaderboard', protect, adminOnly, getDoubtLeaderboard);
router.post('/:id/answer', protect, adminOnly, answerDoubt);
router.post('/:id/close', protect, adminOnly, closeDoubt);

module.exports = router;
