const User = require('../models/User');
const Enrollment = require('../models/Enrollment');
const Settings = require('../models/Settings');
const bcrypt = require('bcryptjs');

// Helper function to calculate profile completion percentage
const calculateProfileCompletion = (user) => {
  const profile = user.profile || {};
  
  // Define all profile fields to check
  const fields = {
    // Basic fields (always present)
    name: user.name ? 1 : 0,
    email: user.email ? 1 : 0,
    avatar: user.avatar && user.avatar !== 'https://ui-avatars.com/api/?name=User&background=random' ? 1 : 0,
    
    // Profile fields
    mobileNumber: profile.mobileNumber && profile.mobileNumber.trim() ? 1 : 0,
    college: profile.college && profile.college.trim() ? 1 : 0,
    currentYear: profile.currentYear && profile.currentYear.trim() ? 1 : 0,
    graduationYear: profile.graduationYear ? 1 : 0,
    skills: profile.skills && Array.isArray(profile.skills) && profile.skills.length > 0 ? 1 : 0,
    interests: profile.interests && Array.isArray(profile.interests) && profile.interests.length > 0 ? 1 : 0,
    bio: profile.bio && profile.bio.trim() ? 1 : 0,
    location: profile.location && profile.location.trim() ? 1 : 0,
    website: profile.website && profile.website.trim() ? 1 : 0,
    github: profile.github && profile.github.trim() ? 1 : 0,
    linkedin: profile.linkedin && profile.linkedin.trim() ? 1 : 0,
    experienceLevel: profile.experienceLevel && profile.experienceLevel.trim() ? 1 : 0,
  };
  
  const totalFields = Object.keys(fields).length;
  const filledFields = Object.values(fields).reduce((sum, val) => sum + val, 0);
  const percentage = Math.round((filledFields / totalFields) * 100);
  
  // Get missing fields for suggestions
  const missingFields = Object.entries(fields)
    .filter(([key, value]) => value === 0)
    .map(([key]) => key);
  
  return {
    percentage,
    filledFields,
    totalFields,
    missingFields,
    isComplete: percentage === 100,
  };
};

// Helper function to calculate coin achievement percentage
const calculateCoinAchievement = (user) => {
  const COIN_TARGET = 5000;
  const currentCoins = user.coins || 0;
  const percentage = Math.min(Math.round((currentCoins / COIN_TARGET) * 100), 100);
  const remainingCoins = Math.max(COIN_TARGET - currentCoins, 0);
  
  return {
    currentCoins,
    targetCoins: COIN_TARGET,
    percentage,
    remainingCoins,
    isAchieved: currentCoins >= COIN_TARGET,
  };
};

// @desc    Get user profile (already exists in authController)
// @route   GET /api/profile
// @access  Private
exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Get user's enrollments count
    const enrollmentCount = await Enrollment.countDocuments({ user: user._id });

    // Get user's completed courses count
    const completedCount = await Enrollment.countDocuments({
      user: user._id,
      status: 'completed',
    });

    // Calculate profile completion
    const profileCompletion = calculateProfileCompletion(user);
    
    // Calculate coin achievement
    const coinAchievement = calculateCoinAchievement(user);

    res.status(200).json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        role: user.role,
        isActive: user.isActive,
        createdAt: user.createdAt,
        coins: user.coins || 0,
        profile: user.profile || {},
        profileCompletion,
        coinAchievement,
        stats: {
          enrolledCourses: enrollmentCount,
          completedCourses: completedCount,
        }
      },
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching profile',
      error: error.message,
    });
  }
};

// @desc    Update user profile
// @route   PUT /api/profile
// @access  Private
exports.updateProfile = async (req, res) => {
  try {
    const { name, avatar, email } = req.body;
    const profilePayload =
      typeof req.body.profile === 'object' && req.body.profile !== null
        ? req.body.profile
        : {};
    const pickProfileValue = (key) =>
      typeof req.body[key] !== 'undefined'
        ? req.body[key]
        : profilePayload[key];
    const normalizeString = (value) => {
      if (typeof value === 'undefined' || value === null) return undefined;
      if (typeof value !== 'string') return value;
      const trimmed = value.trim();
      return trimmed.length ? trimmed : undefined;
    };
    const normalizeArrayField = (value) => {
      if (typeof value === 'undefined' || value === null) return undefined;
      const rawArray = Array.isArray(value)
        ? value
        : String(value)
            .split(',')
            .map((item) => item.trim());
      const cleaned = rawArray
        .map((item) => item.trim())
        .filter((item) => !!item)
        .slice(0, 25);
      return [...new Set(cleaned)];
    };
    const MOBILE_REGEX = /^\+?[0-9]{10,15}$/;

    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Check if email is being changed and if it's already taken
    if (email && email !== user.email) {
      const emailExists = await User.findOne({ email });
      if (emailExists) {
        return res.status(400).json({
          success: false,
          message: 'Email already in use',
        });
      }
      user.email = email;
    }

    // Update fields
    if (name) user.name = name;
    if (avatar) user.avatar = avatar;

    const profileUpdates = {};
    const mobileNumber = pickProfileValue('mobileNumber');
    if (typeof mobileNumber !== 'undefined') {
      if (mobileNumber && !MOBILE_REGEX.test(mobileNumber)) {
        return res.status(400).json({
          success: false,
          message: 'Mobile number must contain 10-15 digits',
        });
      }
      profileUpdates.mobileNumber = mobileNumber || undefined;
    }

    const graduationYear = pickProfileValue('graduationYear');
    if (typeof graduationYear !== 'undefined') {
      if (graduationYear === '' || graduationYear === null) {
        profileUpdates.graduationYear = undefined;
      } else {
        const parsedYear = parseInt(graduationYear, 10);
        if (Number.isNaN(parsedYear) || parsedYear < 1950 || parsedYear > 2100) {
          return res.status(400).json({
            success: false,
            message: 'Graduation year must be between 1950 and 2100',
          });
        }
        profileUpdates.graduationYear = parsedYear;
      }
    }

    const profileStringFields = [
      'college',
      'currentYear',
      'bio',
      'location',
      'website',
      'github',
      'linkedin',
      'experienceLevel',
    ];

    profileStringFields.forEach((field) => {
      const value = pickProfileValue(field);
      if (typeof value !== 'undefined') {
        profileUpdates[field] = normalizeString(value);
      }
    });

    const skills = normalizeArrayField(pickProfileValue('skills'));
    if (typeof skills !== 'undefined') {
      profileUpdates.skills = skills;
    }

    const interests = normalizeArrayField(pickProfileValue('interests'));
    if (typeof interests !== 'undefined') {
      profileUpdates.interests = interests;
    }

    if (Object.keys(profileUpdates).length) {
      const nextProfile = { ...(user.profile || {}) };
      Object.entries(profileUpdates).forEach(([key, value]) => {
        if (typeof value === 'undefined') {
          delete nextProfile[key];
        } else {
          nextProfile[key] = value;
        }
      });
      user.profile = nextProfile;
    }

    await user.save();

    // Calculate profile completion after update
    const profileCompletion = calculateProfileCompletion(user);

    res.status(200).json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        role: user.role,
        profile: user.profile || {},
        profileCompletion,
      },
      message: 'Profile updated successfully',
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error updating profile',
      error: error.message,
    });
  }
};

// @desc    Change password
// @route   PUT /api/profile/change-password
// @access  Private
exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Please provide current and new password',
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 6 characters',
      });
    }

    // Get user with password field
    const user = await User.findById(req.user.id).select('+password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Check if current password is correct
    const isMatch = await user.comparePassword(currentPassword);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Current password is incorrect',
      });
    }

    // Update password (will be hashed by pre-save hook)
    user.password = newPassword;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Password changed successfully',
    });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error changing password',
      error: error.message,
    });
  }
};

// @desc    Delete user account
// @route   DELETE /api/profile
// @access  Private
exports.deleteAccount = async (req, res) => {
  try {
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide your password to confirm account deletion',
      });
    }

    // Get user with password field
    const user = await User.findById(req.user.id).select('+password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Verify password
    const isMatch = await user.comparePassword(password);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Password is incorrect',
      });
    }

    // Delete user's enrollments
    await Enrollment.deleteMany({ user: user._id });

    // Delete user's settings
    await Settings.deleteOne({ user: user._id });

    // Delete user account
    await user.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Account deleted successfully',
      data: {},
    });
  } catch (error) {
    console.error('Delete account error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error deleting account',
      error: error.message,
    });
  }
};

// @desc    Get user's enrollments
// @route   GET /api/profile/enrollments
// @access  Private
exports.getEnrollments = async (req, res) => {
  try {
    console.log('getEnrollments called');
    console.log('User ID:', req.user?.id);
    console.log('User object:', req.user);

    if (!req.user || !req.user.id) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated',
      });
    }

    const { status, page = 1, limit = 10 } = req.query;

    let query = { user: req.user.id };

    if (status) {
      query.status = status;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const enrollments = await Enrollment.find(query)
      .populate('course', 'title description instructor image price duration rating')
      .sort({ enrolledAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const totalEnrollments = await Enrollment.countDocuments(query);

    res.status(200).json({
      success: true,
      count: enrollments.length,
      total: totalEnrollments,
      page: parseInt(page),
      pages: Math.ceil(totalEnrollments / parseInt(limit)),
      enrollments,
    });
  } catch (error) {
    console.error('Get enrollments error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching enrollments',
      error: error.message,
    });
  }
};

// @desc    Get user's settings
// @route   GET /api/profile/settings
// @access  Private
exports.getSettings = async (req, res) => {
  try {
    let settings = await Settings.findOne({ user: req.user.id });

    // Create default settings if not exist
    if (!settings) {
      settings = await Settings.create({ user: req.user.id });
    }

    res.status(200).json({
      success: true,
      settings,
    });
  } catch (error) {
    console.error('Get settings error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching settings',
      error: error.message,
    });
  }
};

// @desc    Update user's settings
// @route   PUT /api/profile/settings
// @access  Private
exports.updateSettings = async (req, res) => {
  try {
    let settings = await Settings.findOne({ user: req.user.id });

    if (!settings) {
      // Create settings if not exist
      settings = await Settings.create({
        user: req.user.id,
        ...req.body,
      });
    } else {
      // Update existing settings
      settings = await Settings.findOneAndUpdate(
        { user: req.user.id },
        req.body,
        {
          new: true,
          runValidators: true,
        }
      );
    }

    res.status(200).json({
      success: true,
      settings,
      message: 'Settings updated successfully',
    });
  } catch (error) {
    console.error('Update settings error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error updating settings',
      error: error.message,
    });
  }
};

// @desc    Get profile completion status
// @route   GET /api/profile/completion
// @access  Private
exports.getProfileCompletion = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    const profileCompletion = calculateProfileCompletion(user);

    res.status(200).json({
      success: true,
      profileCompletion,
      message: profileCompletion.isComplete
        ? 'Your profile is complete!'
        : `Complete ${profileCompletion.totalFields - profileCompletion.filledFields} more field(s) to reach 100%`,
    });
  } catch (error) {
    console.error('Get profile completion error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching profile completion',
      error: error.message,
    });
  }
};

// @desc    Get coin achievement status
// @route   GET /api/profile/coin-achievement
// @access  Private
exports.getCoinAchievement = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    const coinAchievement = calculateCoinAchievement(user);

    res.status(200).json({
      success: true,
      coinAchievement,
      message: coinAchievement.isAchieved
        ? 'Congratulations! You have reached the 5000 coin target! 🎉'
        : `Earn ${coinAchievement.remainingCoins} more coins to reach the 5000 coin target`,
    });
  } catch (error) {
    console.error('Get coin achievement error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching coin achievement',
      error: error.message,
    });
  }
};

// @desc    Upload avatar (placeholder - needs multer or cloudinary)
// @route   POST /api/profile/avatar
// @access  Private
exports.uploadAvatar = async (req, res) => {
  try {
    const { avatarUrl } = req.body;

    if (!avatarUrl) {
      return res.status(400).json({
        success: false,
        message: 'Please provide avatar URL',
      });
    }

    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    user.avatar = avatarUrl;
    await user.save();

    res.status(200).json({
      success: true,
      avatar: user.avatar,
      message: 'Avatar updated successfully',
    });
  } catch (error) {
    console.error('Upload avatar error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error uploading avatar',
      error: error.message,
    });
  }
};

