const express = require('express');
const router = express.Router();
const {
  getAllDoubts,
  getDoubtStats,
  answerDoubt,
  closeDoubt,
  getDoubtLeaderboard,
} = require('../../controllers/adminDoubtController');
const { protect } = require('../../middleware/auth');
const { admin } = require('../../middleware/admin');

// Admin doubt routes
router.get('/', protect, admin, getAllDoubts);
router.get('/stats', protect, admin, getDoubtStats);
router.get('/leaderboard', protect, admin, getDoubtLeaderboard);
router.post('/:id/answer', protect, admin, answerDoubt);
router.post('/:id/close', protect, admin, closeDoubt);

module.exports = router;