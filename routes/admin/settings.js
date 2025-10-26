const express = require('express');
const router = express.Router();
const {
  getUserSettings,
  updateUserSettings,
  resetUserSettings,
  getAllSettings,
  getSettingsStats,
} = require('../../controllers/settingsController');
const { protect } = require('../../middleware/auth');
const { adminOnly } = require('../../middleware/admin');

// All routes are protected and admin-only
router.use(protect);
router.use(adminOnly);

router.get('/stats', getSettingsStats);
router.get('/', getAllSettings);

router.route('/:userId')
  .get(getUserSettings)
  .put(updateUserSettings);

router.post('/:userId/reset', resetUserSettings);

module.exports = router;

