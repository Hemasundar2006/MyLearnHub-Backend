const express = require('express');
const router = express.Router();
const {
  submitThought,
  getUserThoughts,
  getUserThoughtStats,
  deleteThought,
  getCoinBalance,
  getCoinTransactions,
} = require('../controllers/thoughtController');
const { protect } = require('../middleware/auth');

// All routes are protected (require authentication)
router.use(protect);

// User thought routes
router.post('/', submitThought);
router.get('/my-thoughts', getUserThoughts);
router.get('/my-stats', getUserThoughtStats);

// Coin routes - must be before /:id routes
router.get('/coins', getCoinBalance);
router.get('/coins/transactions', getCoinTransactions);

// Parameterized routes last
router.delete('/:id', deleteThought);

module.exports = router;

