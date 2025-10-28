const express = require('express');
const router = express.Router();
const {
  getAllNotifications,
  createNotification,
  getNotificationById,
  updateNotification,
  deleteNotification,
  getNotificationStats,
} = require('../../controllers/notificationController');
const { protect } = require('../../middleware/auth');
const { adminOnly } = require('../../middleware/admin');

// All routes are protected and admin-only
router.use(protect);
router.use(adminOnly);

// Debug middleware for POST requests
router.use((req, res, next) => {
  if (req.method === 'POST') {
    console.log('Notification POST request body:', req.body);
    console.log('Request headers:', req.headers);
  }
  next();
});

router.get('/stats', getNotificationStats);

router.route('/')
  .get(getAllNotifications)
  .post(createNotification);

router.route('/:id')
  .get(getNotificationById)
  .put(updateNotification)
  .delete(deleteNotification);

module.exports = router;

