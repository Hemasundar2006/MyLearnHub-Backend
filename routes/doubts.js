const express = require('express');
const router = express.Router();
const {
  submitDoubt,
  getUserDoubts,
  getUserDoubtStats,
  deleteDoubt,
  getLeaderboard,
} = require('../controllers/doubtController');
const { protect } = require('../middleware/auth');

// User routes
router.post('/', protect, submitDoubt);
router.get('/my-doubts', protect, getUserDoubts);
router.get('/my-stats', protect, getUserDoubtStats);
router.delete('/:id', protect, deleteDoubt);

// Public routes
router.get('/leaderboard', getLeaderboard);

module.exports = router;
