const Course = require('../models/Course');
const User = require('../models/User');
const { generateToken } = require('../middleware/auth');

// ============ ADMIN AUTHENTICATION ============

// @desc    Admin login
// @route   POST /api/admin/auth/login
// @access  Public
exports.adminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password',
      });
    }

    // Check for user and include password field
    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
      });
    }

    // Check if user is admin
    if (user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin privileges required.',
      });
    }

    // Check if password matches
    const isMatch = await user.comparePassword(password);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
      });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Account is deactivated. Please contact support.',
      });
    }

    // Generate token
    const token = generateToken(user._id);

    res.status(200).json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('Admin login error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during login',
      error: error.message,
    });
  }
};

// @desc    Get admin profile
// @route   GET /api/admin/auth/profile
// @access  Private/Admin
exports.getAdminProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    res.status(200).json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        role: user.role,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    console.error('Get admin profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching profile',
      error: error.message,
    });
  }
};

// ============ ADMIN COURSE MANAGEMENT ============

// @desc    Get all courses (including drafts)
// @route   GET /api/admin/courses
// @access  Private/Admin
exports.getAllCourses = async (req, res) => {
  try {
    const { status } = req.query;
    
    let query = {};
    if (status) {
      query.status = status;
    }

    const courses = await Course.find(query)
      .sort({ createdAt: -1 })
      .populate('createdBy', 'name email');

    res.status(200).json({
      success: true,
      count: courses.length,
      courses,
    });
  } catch (error) {
    console.error('Get all courses error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching courses',
      error: error.message,
    });
  }
};

// @desc    Create new course
// @route   POST /api/admin/courses
// @access  Private/Admin
exports.createCourse = async (req, res) => {
  try {
    const {
      title,
      description,
      instructor,
      duration,
      price,
      image,
      status,
      category,
      level,
    } = req.body;

    // Validation
    if (!title || !description || !instructor || !duration || price === undefined || !image) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields (title, description, instructor, duration, price, image)',
      });
    }

    // Create course
    const course = await Course.create({
      title,
      description,
      instructor,
      duration,
      price,
      image,
      status: status || 'published',
      category,
      level,
      createdBy: req.user.id,
    });

    res.status(201).json({
      success: true,
      course,
      message: 'Course created successfully',
    });
  } catch (error) {
    console.error('Create course error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error creating course',
      error: error.message,
    });
  }
};

// @desc    Update course
// @route   PUT /api/admin/courses/:id
// @access  Private/Admin
exports.updateCourse = async (req, res) => {
  try {
    let course = await Course.findById(req.params.id);

    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found',
      });
    }

    // Update course
    course = await Course.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true,
      }
    );

    res.status(200).json({
      success: true,
      course,
      message: 'Course updated successfully',
    });
  } catch (error) {
    console.error('Update course error:', error);
    
    // Handle invalid MongoDB ID
    if (error.kind === 'ObjectId') {
      return res.status(404).json({
        success: false,
        message: 'Course not found',
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error updating course',
      error: error.message,
    });
  }
};

// @desc    Delete course
// @route   DELETE /api/admin/courses/:id
// @access  Private/Admin
exports.deleteCourse = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);

    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found',
      });
    }

    await course.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Course deleted successfully',
      data: {},
    });
  } catch (error) {
    console.error('Delete course error:', error);
    
    // Handle invalid MongoDB ID
    if (error.kind === 'ObjectId') {
      return res.status(404).json({
        success: false,
        message: 'Course not found',
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error deleting course',
      error: error.message,
    });
  }
};

// @desc    Get course by ID (admin view)
// @route   GET /api/admin/courses/:id
// @access  Private/Admin
exports.getCourseById = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id)
      .populate('createdBy', 'name email avatar');

    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found',
      });
    }

    res.status(200).json({
      success: true,
      course,
    });
  } catch (error) {
    console.error('Get course by ID error:', error);
    
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

