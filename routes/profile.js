const express = require('express');
const router = express.Router();
const {
  getProfile,
  updateProfile,
  changePassword,
  deleteAccount,
  getEnrollments,
  getSettings,
  updateSettings,
  uploadAvatar,
} = require('../controllers/userProfileController');
const { protect } = require('../middleware/auth');

// All routes are protected (require authentication)
router.use(protect);

// Profile routes
router.route('/')
  .get(getProfile)
  .put(updateProfile)
  .delete(deleteAccount);

router.put('/change-password', changePassword);
router.post('/avatar', uploadAvatar);

// Enrollments
router.get('/enrollments', getEnrollments);

// Settings
router.route('/settings')
  .get(getSettings)
  .put(updateSettings);

module.exports = router;

