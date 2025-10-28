const express = require('express');
const router = express.Router();
const {
  getAllThoughts,
  getThoughtStats,
  getThoughtById,
  approveThought,
  rejectThought,
  deleteThought,
} = require('../../controllers/adminThoughtController');
const { protect } = require('../../middleware/auth');
const { adminOnly } = require('../../middleware/admin');

// All routes are protected and require admin role
router.use(protect);
router.use(adminOnly);

// GET routes - order matters! Specific routes before parameterized routes
router.get('/stats', getThoughtStats);
router.get('/', getAllThoughts);
router.get('/:id', getThoughtById);

// POST routes
router.post('/:id/approve', approveThought);
router.post('/:id/reject', rejectThought);

// DELETE routes
router.delete('/:id', deleteThought);

module.exports = router;

