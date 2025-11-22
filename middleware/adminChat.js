const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');

// Protect routes - verify JWT token for Admin
exports.protect = async (req, res, next) => {
  let token;

  // Extract token from headers
  const authHeader = req.header('Authorization');
  token = (authHeader && authHeader.replace(/^Bearer\s+/i, ''))
    || req.header('x-auth-token')
    || req.header('x-access-token')
    || (req.cookies && req.cookies.token);

  // Make sure token exists
  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized.',
    });
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Get admin from token
    req.admin = await Admin.findById(decoded.id).select('-password');

    if (!req.admin) {
      return res.status(401).json({
        success: false,
        message: 'Admin not found',
      });
    }

    if (!req.admin.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Admin account is deactivated',
      });
    }

    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized.',
    });
  }
};


