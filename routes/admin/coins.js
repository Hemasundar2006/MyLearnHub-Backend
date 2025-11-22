const express = require('express');
const router = express.Router();
const { getAllUsersCoinTransactions } = require('../../controllers/coinTransactionController');
const { protect: protectAdmin } = require('../../middleware/adminChat');

// Admin coin transaction routes
router.use(protectAdmin);
router.get('/transactions', getAllUsersCoinTransactions);

module.exports = router;

