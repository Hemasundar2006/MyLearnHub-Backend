const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Protect routes - verify JWT token
exports.protect = async (req, res, next) => {
  let token;

  console.log('Auth middleware - Headers:', req.headers.authorization);

  // Check for token in Authorization header
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
    console.log('Token found:', token ? 'Yes' : 'No');
  }

  // Make sure token exists
  if (!token) {
    console.log('No token provided');
    return res.status(401).json({
      success: false,
      message: 'Not authorized to access this route',
    });
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('Token decoded successfully, user ID:', decoded.id);

    // Get user from token
    req.user = await User.findById(decoded.id).select('-password');

    if (!req.user) {
      console.log('User not found in database');
      return res.status(401).json({
        success: false,
        message: 'User not found',
      });
    }

    if (!req.user.isActive) {
      console.log('User account is deactivated');
      return res.status(401).json({
        success: false,
        message: 'User account is deactivated',
      });
    }

    console.log('User authenticated successfully:', req.user.email);
    next();
  } catch (error) {
    console.log('Token verification failed:', error.message);
    return res.status(401).json({
      success: false,
      message: 'Not authorized to access this route',
    });
  }
};

// Generate JWT Token
exports.generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE,
  });
};

