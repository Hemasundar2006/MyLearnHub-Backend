const express = require('express');
const router = express.Router();
const { getCourses, getCourse } = require('../controllers/courseController');

// Public routes
router.get('/', getCourses);
router.get('/:id', getCourse);

module.exports = router;

