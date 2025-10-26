const Settings = require('../models/Settings');
const User = require('../models/User');

// @desc    Get user settings
// @route   GET /api/admin/settings/:userId
// @access  Private/Admin
exports.getUserSettings = async (req, res) => {
  try {
    const userId = req.params.userId || req.user.id;

    let settings = await Settings.findOne({ user: userId }).populate('user', 'name email avatar');

    // Create default settings if not exist
    if (!settings) {
      settings = await Settings.create({ user: userId });
      settings = await Settings.findById(settings._id).populate('user', 'name email avatar');
    }

    res.status(200).json({
      success: true,
      settings,
    });
  } catch (error) {
    console.error('Get user settings error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching settings',
      error: error.message,
    });
  }
};

// @desc    Update user settings
// @route   PUT /api/admin/settings/:userId
// @access  Private/Admin
exports.updateUserSettings = async (req, res) => {
  try {
    const userId = req.params.userId || req.user.id;

    let settings = await Settings.findOne({ user: userId });

    if (!settings) {
      // Create settings if not exist
      settings = await Settings.create({
        user: userId,
        ...req.body,
      });
    } else {
      // Update existing settings
      settings = await Settings.findOneAndUpdate(
        { user: userId },
        req.body,
        {
          new: true,
          runValidators: true,
        }
      );
    }

    settings = await Settings.findById(settings._id).populate('user', 'name email avatar');

    res.status(200).json({
      success: true,
      settings,
      message: 'Settings updated successfully',
    });
  } catch (error) {
    console.error('Update user settings error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error updating settings',
      error: error.message,
    });
  }
};

// @desc    Reset user settings to default
// @route   POST /api/admin/settings/:userId/reset
// @access  Private/Admin
exports.resetUserSettings = async (req, res) => {
  try {
    const userId = req.params.userId || req.user.id;

    let settings = await Settings.findOne({ user: userId });

    if (!settings) {
      settings = await Settings.create({ user: userId });
    } else {
      // Reset to defaults
      settings = await Settings.findOneAndUpdate(
        { user: userId },
        {
          notifications: {
            email: {
              enabled: true,
              courseUpdates: true,
              newContent: true,
              systemAlerts: true,
              marketing: false,
            },
            push: {
              enabled: true,
              courseReminders: true,
              assignments: true,
              messages: true,
            },
            sms: {
              enabled: false,
              urgentOnly: true,
            },
          },
          privacy: {
            profileVisibility: 'students',
            showEnrollments: true,
            showProgress: true,
            allowMessages: true,
            dataSharing: false,
          },
          preferences: {
            language: 'en',
            timezone: 'UTC',
            darkMode: false,
            autoBackup: true,
            emailDigest: 'weekly',
          },
          security: {
            twoFactorEnabled: false,
            loginAlerts: true,
            sessionTimeout: 30,
          },
        },
        {
          new: true,
          runValidators: true,
        }
      );
    }

    settings = await Settings.findById(settings._id).populate('user', 'name email avatar');

    res.status(200).json({
      success: true,
      settings,
      message: 'Settings reset to default successfully',
    });
  } catch (error) {
    console.error('Reset user settings error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error resetting settings',
      error: error.message,
    });
  }
};

// @desc    Get all users settings (Admin only)
// @route   GET /api/admin/settings
// @access  Private/Admin
exports.getAllSettings = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const settings = await Settings.find()
      .populate('user', 'name email avatar role')
      .sort({ updatedAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const totalSettings = await Settings.countDocuments();

    res.status(200).json({
      success: true,
      count: settings.length,
      total: totalSettings,
      page: parseInt(page),
      pages: Math.ceil(totalSettings / parseInt(limit)),
      settings,
    });
  } catch (error) {
    console.error('Get all settings error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching all settings',
      error: error.message,
    });
  }
};

// @desc    Get settings statistics
// @route   GET /api/admin/settings/stats
// @access  Private/Admin
exports.getSettingsStats = async (req, res) => {
  try {
    const totalSettings = await Settings.countDocuments();

    // Dark mode users
    const darkModeUsers = await Settings.countDocuments({
      'preferences.darkMode': true,
    });

    // Two-factor enabled
    const twoFactorUsers = await Settings.countDocuments({
      'security.twoFactorEnabled': true,
    });

    // Email notifications enabled
    const emailNotificationsEnabled = await Settings.countDocuments({
      'notifications.email.enabled': true,
    });

    // Push notifications enabled
    const pushNotificationsEnabled = await Settings.countDocuments({
      'notifications.push.enabled': true,
    });

    // Language preferences
    const languageStats = await Settings.aggregate([
      {
        $group: {
          _id: '$preferences.language',
          count: { $sum: 1 },
        },
      },
    ]);

    // Privacy settings
    const privacyStats = await Settings.aggregate([
      {
        $group: {
          _id: '$privacy.profileVisibility',
          count: { $sum: 1 },
        },
      },
    ]);

    res.status(200).json({
      success: true,
      stats: {
        total: totalSettings,
        darkModeUsers,
        twoFactorUsers,
        emailNotificationsEnabled,
        pushNotificationsEnabled,
        languageStats,
        privacyStats,
      },
    });
  } catch (error) {
    console.error('Get settings stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching settings statistics',
      error: error.message,
    });
  }
};

