const express = require('express');
const router = express.Router();
const {
  getDashboardStats,
  getRecentActivity,
  getPerformanceMetrics,
} = require('../../controllers/dashboardController');
const { protect } = require('../../middleware/auth');
const { adminOnly } = require('../../middleware/admin');

// All routes are protected and admin-only
router.use(protect);
router.use(adminOnly);

router.get('/stats', getDashboardStats);
router.get('/activity', getRecentActivity);
router.get('/metrics', getPerformanceMetrics);

module.exports = router;

