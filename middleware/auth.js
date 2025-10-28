const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Protect routes - verify JWT token
exports.protect = async (req, res, next) => {
  let token;

  console.log('Auth middleware - Headers:', req.headers.authorization);

  // Check for token in common headers (Authorization, x-auth-token, x-access-token)
  const authHeader = req.headers.authorization;
  if (authHeader && /^Bearer\s+/i.test(authHeader)) {
    token = authHeader.split(' ')[1];
    console.log('Token found in Authorization header:', token ? 'Yes' : 'No');
  } else if (req.headers['x-auth-token']) {
    token = req.headers['x-auth-token'];
    console.log('Token found in x-auth-token header:', token ? 'Yes' : 'No');
  } else if (req.headers['x-access-token']) {
    token = req.headers['x-access-token'];
    console.log('Token found in x-access-token header:', token ? 'Yes' : 'No');
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

