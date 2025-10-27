const express = require('express');
const router = express.Router();
const {
  getUserNotifications,
  getUnreadCount,
  getCategoryCounts,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  dismissNotification,
} = require('../controllers/userNotificationController');
const { protect } = require('../middleware/auth');

// All routes are protected (require authentication)
router.use(protect);

// GET routes - order matters! Specific routes before parameterized routes
router.get('/unread-count', getUnreadCount);
router.get('/category-counts', getCategoryCounts);
router.get('/', getUserNotifications);

// POST routes
router.post('/:id/read', markAsRead);
router.post('/read-all', markAllAsRead);
router.post('/:id/dismiss', dismissNotification);

// DELETE routes
router.delete('/:id', deleteNotification);

module.exports = router;

