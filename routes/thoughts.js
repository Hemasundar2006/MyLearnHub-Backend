const express = require('express');
const router = express.Router();
const {
  submitThought,
  getUserThoughts,
  getUserThoughtStats,
  deleteThought,
  getCoinBalance,
  getCoinTransactions,
  getApprovedThoughts,
} = require('../controllers/thoughtController');
const { protect } = require('../middleware/auth');

// Public routes (no authentication)
router.get('/approved', getApprovedThoughts);

// User thought routes
router.use(protect);
router.post('/', submitThought);
router.get('/my-thoughts', getUserThoughts);
router.get('/my-stats', getUserThoughtStats);

// Coin routes - must be before /:id routes
router.get('/coins', getCoinBalance);
router.get('/coins/transactions', getCoinTransactions);

// Parameterized routes last
router.delete('/:id', deleteThought);

module.exports = router;

