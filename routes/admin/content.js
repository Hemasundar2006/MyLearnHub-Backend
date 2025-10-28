const express = require('express');
const router = express.Router();
const {
  getAllContent,
  createContent,
  getContentById,
  updateContent,
  deleteContent,
  getContentStats,
  incrementViews,
  incrementDownloads,
} = require('../../controllers/contentController');
const { protect } = require('../../middleware/auth');
const { admin } = require('../../middleware/admin');

// All routes are protected and admin-only
router.use(protect);
router.use(admin);

router.get('/stats', getContentStats);

router.route('/')
  .get(getAllContent)
  .post(createContent);

router.route('/:id')
  .get(getContentById)
  .put(updateContent)
  .delete(deleteContent);

router.post('/:id/view', incrementViews);
router.post('/:id/download', incrementDownloads);

module.exports = router;

