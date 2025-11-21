const express = require('express');
const router = express.Router();
const {
  getAllQuizzes,
  getQuizById,
  submitQuiz,
  getUserResults,
  getUserQuizResult,
  getQuizLeaderboard,
  checkQuizCompletion,
} = require('../controllers/quizController');
const { protect } = require('../middleware/auth');

// Public routes
router.get('/', getAllQuizzes);
router.get('/leaderboard', getQuizLeaderboard); // Quiz leaderboard

// Protected routes - specific routes first
router.post('/submit', protect, submitQuiz);
router.post('/:id/submit', protect, submitQuiz); // Support quiz ID in URL
router.get('/results/me', protect, getUserResults);
router.get('/my-results', protect, getUserResults); // Alias for /results/me
router.get('/:id/check-completion', protect, checkQuizCompletion); // Check if user completed quiz (must be before /:id)
router.get('/:id/my-result', protect, getUserQuizResult); // Get user's result for specific quiz (must be before /:id)

// Parameterized routes last
router.get('/:id', getQuizById);

module.exports = router;

