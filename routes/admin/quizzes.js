const express = require('express');
const router = express.Router();
const {
  getAllQuizzes,
  getQuizById,
  createQuiz,
  updateQuiz,
  deleteQuiz,
  toggleQuizStatus,
  getQuizStats,
  getAllQuizResults,
  getUserQuizDetails,
  getQuizResultById,
} = require('../../controllers/adminQuizController');
const { protect } = require('../../middleware/auth');
const { adminOnly } = require('../../middleware/admin');

// All routes require admin authentication
router.use(protect);
router.use(adminOnly);

// Quiz management routes
router.route('/')
  .get(getAllQuizzes)
  .post(createQuiz);

// Specific routes first (before parameterized routes)
router.route('/stats')
  .get(getQuizStats);

// Quiz results and scores
router.get('/results', getAllQuizResults);
router.get('/results/:id', getQuizResultById);

// User quiz details
router.get('/users/:userId', getUserQuizDetails);

// Parameterized routes last
router.route('/:id')
  .get(getQuizById)
  .put(updateQuiz)
  .delete(deleteQuiz);

router.patch('/:id/toggle-status', toggleQuizStatus);

module.exports = router;

