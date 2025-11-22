const express = require('express');
const router = express.Router();
const {
  requestChat,
  endChat,
  getUserSessions,
  getChatMessages,
  getChatRequestConstraints,
  calculateChatCoins,
  checkBalanceAndAdjust,
} = require('../controllers/chatController');
const { protect } = require('../middleware/auth');

// User routes
router.get('/request/constraints', protect, getChatRequestConstraints);
router.post('/request/calculate', protect, calculateChatCoins);
router.get('/request/balance-check', protect, checkBalanceAndAdjust);
router.post('/request', protect, requestChat);
router.post('/end/:sessionId', protect, endChat);
router.get('/sessions', protect, getUserSessions);
router.get('/messages/:sessionId', protect, getChatMessages);

module.exports = router;


