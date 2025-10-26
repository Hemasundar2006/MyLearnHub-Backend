const express = require('express');
const router = express.Router();
const {
  getUserNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
} = require('../controllers/userNotificationController');
const { protect } = require('../middleware/auth');

// All routes are protected (require authentication)
router.use(protect);

router.get('/', getUserNotifications);
router.get('/unread-count', getUnreadCount);
router.post('/:id/read', markAsRead);
router.post('/read-all', markAllAsRead);
router.delete('/:id', deleteNotification);

module.exports = router;

