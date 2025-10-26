const Course = require('../models/Course');

// @desc    Get all published courses
// @route   GET /api/courses
// @access  Public
exports.getCourses = async (req, res) => {
  try {
    const courses = await Course.find({ status: 'published' })
      .sort({ createdAt: -1 })
      .populate('createdBy', 'name email');

    res.status(200).json({
      success: true,
      count: courses.length,
      courses,
    });
  } catch (error) {
    console.error('Get courses error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching courses',
      error: error.message,
    });
  }
};

// @desc    Get single course by ID
// @route   GET /api/courses/:id
// @access  Public
exports.getCourse = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id)
      .populate('createdBy', 'name email avatar');

    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found',
      });
    }

    // Only show published courses to public
    if (course.status !== 'published') {
      return res.status(404).json({
        success: false,
        message: 'Course not available',
      });
    }

    res.status(200).json({
      success: true,
      course,
    });
  } catch (error) {
    console.error('Get course error:', error);
    
    // Handle invalid MongoDB ID
    if (error.kind === 'ObjectId') {
      return res.status(404).json({
        success: false,
        message: 'Course not found',
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error fetching course',
      error: error.message,
    });
  }
};

