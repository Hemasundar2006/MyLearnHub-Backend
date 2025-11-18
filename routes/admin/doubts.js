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
router.use(protect);
router.use(adminOnly);

router.get('/', getAllDoubts);
router.get('/stats', getDoubtStats);
router.get('/leaderboard', getDoubtLeaderboard);
router.post('/:id/answer', answerDoubt);
router.post('/:id/close', closeDoubt);

module.exports = router;
