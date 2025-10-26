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

router.get('/stats', getNotificationStats);

router.route('/')
  .get(getAllNotifications)
  .post(createNotification);

router.route('/:id')
  .get(getNotificationById)
  .put(updateNotification)
  .delete(deleteNotification);

module.exports = router;

