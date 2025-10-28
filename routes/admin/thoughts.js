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

// Debug middleware to log all requests
router.use((req, res, next) => {
  console.log('Admin thoughts route hit:', req.method, req.path);
  console.log('Route params:', req.params);
  console.log('Query params:', req.query);
  console.log('Request body:', req.body);
  console.log('Request headers:', req.headers);
  next();
});

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

