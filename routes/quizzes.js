const express = require('express');
const router = express.Router();
const {
  getAllQuizzes,
  getQuizById,
  submitQuiz,
  getUserResults,
  getQuizLeaderboard,
} = require('../controllers/quizController');
const { protect } = require('../middleware/auth');

// Public routes
router.get('/', getAllQuizzes);
router.get('/leaderboard', getQuizLeaderboard); // Quiz leaderboard

// Protected routes - specific routes first
router.post('/submit', protect, submitQuiz);
router.post('/:id/submit', protect, submitQuiz); // Support quiz ID in URL
router.get('/results/me', protect, getUserResults);

// Parameterized routes last
router.get('/:id', getQuizById);

module.exports = router;

