const express = require('express');
const router = express.Router();
const {
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
  toggleUserStatus,
  getUserStats,
} = require('../../controllers/userManagementController');
const { protect } = require('../../middleware/auth');
const { admin } = require('../../middleware/admin');

// All routes are protected and admin-only
router.use(protect);
router.use(admin);

router.get('/stats', getUserStats);
router.route('/')
  .get(getAllUsers);

router.route('/:id')
  .get(getUserById)
  .put(updateUser)
  .delete(deleteUser);

router.patch('/:id/suspend', toggleUserStatus);

module.exports = router;

