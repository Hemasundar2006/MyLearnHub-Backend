const express = require('express');
const router = express.Router();
const {
  getAnalyticsOverview,
  getRevenueAnalytics,
  getUserAnalytics,
  getCourseAnalytics,
  getEnrollmentAnalytics,
} = require('../../controllers/analyticsController');
const { protect } = require('../../middleware/auth');
const { admin } = require('../../middleware/admin');

// All routes are protected and admin-only
router.use(protect);
router.use(admin);

router.get('/overview', getAnalyticsOverview);
router.get('/revenue', getRevenueAnalytics);
router.get('/users', getUserAnalytics);
router.get('/courses', getCourseAnalytics);
router.get('/enrollments', getEnrollmentAnalytics);

module.exports = router;

