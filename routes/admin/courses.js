const express = require('express');
const router = express.Router();
const {
  getAllCourses,
  createCourse,
  updateCourse,
  deleteCourse,
  getCourseById,
} = require('../../controllers/adminController');
const { protect } = require('../../middleware/auth');
const { admin } = require('../../middleware/admin');

// All routes are protected and admin-only
router.use(protect);
router.use(admin);

// Admin course management routes
router.route('/')
  .get(getAllCourses)
  .post(createCourse);

router.route('/:id')
  .get(getCourseById)
  .put(updateCourse)
  .delete(deleteCourse);

module.exports = router;

