const express = require('express');
const router = express.Router();
const { getUserCoinTransactions } = require('../controllers/coinTransactionController');
const { protect } = require('../middleware/auth');

// User coin transaction routes
router.use(protect);
router.get('/transactions', getUserCoinTransactions);

module.exports = router;

