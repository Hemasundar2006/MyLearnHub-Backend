const express = require('express');
const router = express.Router();
const {
  adminLogin,
  getAdminProfile,
} = require('../../controllers/adminController');
const { protect } = require('../../middleware/auth');
const { admin } = require('../../middleware/admin');

// Admin authentication routes
router.post('/login', adminLogin);
router.get('/profile', protect, admin, getAdminProfile);

module.exports = router;

