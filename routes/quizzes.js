const express = require('express');
const router = express.Router();
const {
  getAllQuizzes,
  getQuizById,
  submitQuiz,
  getUserResults,
} = require('../controllers/quizController');
const { protect } = require('../middleware/auth');

// Public routes
router.get('/', getAllQuizzes);
router.get('/:id', getQuizById);

// Protected routes
router.post('/submit', protect, submitQuiz);
router.get('/results/me', protect, getUserResults);

module.exports = router;

