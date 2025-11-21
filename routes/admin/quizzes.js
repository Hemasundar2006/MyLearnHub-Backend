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

router.route('/stats')
  .get(getQuizStats);

router.route('/:id')
  .get(getQuizById)
  .put(updateQuiz)
  .delete(deleteQuiz);

router.patch('/:id/toggle-status', toggleQuizStatus);

module.exports = router;

