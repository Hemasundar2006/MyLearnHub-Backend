const express = require('express');
const router = express.Router();
const {
  acceptChat,
  getPendingChats,
  endChat,
  getChatMessages,
  getAdminActiveSessions,
  getSessionStatus,
} = require('../../controllers/chatController');
const { getChatMembers } = require('../../controllers/coinTransactionController');
const { protect: protectAdmin } = require('../../middleware/adminChat');
const { register, login } = require('../../controllers/adminChatController');

// Admin authentication routes
router.post('/register', register);
router.post('/login', login);

// Admin chat routes
router.get('/pending', protectAdmin, getPendingChats);
router.get('/active', protectAdmin, getAdminActiveSessions);
router.get('/members', protectAdmin, getChatMembers);
router.get('/session/:sessionId/status', protectAdmin, getSessionStatus);
router.post('/accept/:sessionId', protectAdmin, acceptChat);
router.post('/end/:sessionId', protectAdmin, endChat);
router.get('/messages/:sessionId', protectAdmin, getChatMessages);

module.exports = router;


