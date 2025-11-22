const Admin = require('../models/Admin');
const { generateToken } = require('../middleware/auth');

// @desc    Register admin
// @route   POST /api/admin/chat/register
// @access  Public (in production, this should be protected)
exports.register = async (req, res) => {
  try {
    const { adminName, password } = req.body;

    // Validation
    if (!adminName || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide adminName and password',
      });
    }

    // Check if admin exists
    const adminExists = await Admin.findOne({ adminName });

    if (adminExists) {
      return res.status(400).json({
        success: false,
        message: 'Admin already exists with this name',
      });
    }

    // Create admin
    const admin = await Admin.create({
      adminName,
      password,
    });

    // Generate token
    const token = generateToken(admin._id);

    res.status(201).json({
      success: true,
      token,
      admin: {
        id: admin._id,
        adminName: admin.adminName,
      },
      message: 'Admin registered successfully',
    });
  } catch (error) {
    console.error('Admin register error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during registration',
      error: error.message,
    });
  }
};

// @desc    Login admin
// @route   POST /api/admin/chat/login
// @access  Public
exports.login = async (req, res) => {
  try {
    const { adminName, password } = req.body;

    // Validation
    if (!adminName || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide adminName and password',
      });
    }

    // Check for admin and include password field
    const admin = await Admin.findOne({ adminName }).select('+password');

    if (!admin) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
      });
    }

    // Check if password matches
    const isMatch = await admin.comparePassword(password);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
      });
    }

    // Check if admin is active
    if (!admin.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Admin account is deactivated. Please contact support.',
      });
    }

    // Generate token
    const token = generateToken(admin._id);

    res.status(200).json({
      success: true,
      token,
      admin: {
        id: admin._id,
        adminName: admin.adminName,
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


