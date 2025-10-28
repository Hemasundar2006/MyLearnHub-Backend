const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Protect routes - verify JWT token
exports.protect = async (req, res, next) => {
  let token;

  console.log('Auth middleware - Headers present:', Boolean(req.headers.authorization));

  // Concise token extraction (Authorization Bearer, x-auth-token, x-access-token)
  const authHeader = req.header('Authorization');
  token = (authHeader && authHeader.replace(/^Bearer\s+/i, ''))
    || req.header('x-auth-token')
    || req.header('x-access-token')
    || (req.cookies && req.cookies.token);

  // Make sure token exists
  if (!token) {
    console.log('No token provided');
    return res.status(401).json({
      success: false,
      message: 'Not authorized.',
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
      message: 'Not authorized.',
    });
  }
};

// Generate JWT Token
exports.generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE,
  });
};

