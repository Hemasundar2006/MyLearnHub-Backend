const User = require('../models/User');
const Enrollment = require('../models/Enrollment');

// @desc    Get all users
// @route   GET /api/admin/users
// @access  Private/Admin
exports.getAllUsers = async (req, res) => {
  try {
    const { search, role, status, profileComplete, page = 1, limit = 10 } = req.query;

    // Build query
    let query = {};
    const andConditions = [];

    // Search filter
    if (search) {
      andConditions.push({
        $or: [
          { name: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } },
        ],
      });
    }

    // Role filter
    if (role) {
      query.role = role;
    }

    // Status filter
    if (status) {
      query.isActive = status === 'active';
    }

    // Profile completion filter
    if (profileComplete === 'true') {
      query.profileCompletionRewardClaimed = true;
    } else if (profileComplete === 'false') {
      andConditions.push({
        $or: [
          { profileCompletionRewardClaimed: false },
          { profileCompletionRewardClaimed: { $exists: false } },
        ],
      });
    }

    // Combine $and conditions if any
    if (andConditions.length > 0) {
      query.$and = andConditions;
    }

    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const users = await User.find(query)
      .select('-password')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    // Get enrollment count and profile completion for each user
    const usersWithEnrollments = await Promise.all(
      users.map(async (user) => {
        const enrollmentCount = await Enrollment.countDocuments({ user: user._id });
        
        // Calculate profile completion
        const profile = user.profile || {};
        const profileFields = {
          name: user.name ? 1 : 0,
          email: user.email ? 1 : 0,
          avatar: user.avatar && user.avatar !== 'https://ui-avatars.com/api/?name=User&background=random' ? 1 : 0,
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
        const totalFields = Object.keys(profileFields).length;
        const filledFields = Object.values(profileFields).reduce((sum, val) => sum + val, 0);
        const profileCompletionPercentage = Math.round((filledFields / totalFields) * 100);
        
        return {
          ...user.toObject(),
          enrollmentCount,
          profileCompletion: {
            percentage: profileCompletionPercentage,
            filledFields,
            totalFields,
            isComplete: profileCompletionPercentage === 100,
            rewardClaimed: user.profileCompletionRewardClaimed || false,
            rewardClaimedAt: user.profileCompletionRewardClaimedAt || null,
          },
        };
      })
    );

    const totalUsers = await User.countDocuments(query);

    res.status(200).json({
      success: true,
      count: users.length,
      total: totalUsers,
      page: parseInt(page),
      pages: Math.ceil(totalUsers / parseInt(limit)),
      users: usersWithEnrollments,
    });
  } catch (error) {
    console.error('Get all users error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching users',
      error: error.message,
    });
  }
};

// @desc    Get user by ID
// @route   GET /api/admin/users/:id
// @access  Private/Admin
exports.getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Get user enrollments
    const enrollments = await Enrollment.find({ user: user._id })
      .populate('course', 'title image price')
      .sort({ enrolledAt: -1 });

    // Calculate profile completion
    const profile = user.profile || {};
    const profileFields = {
      name: user.name ? 1 : 0,
      email: user.email ? 1 : 0,
      avatar: user.avatar && user.avatar !== 'https://ui-avatars.com/api/?name=User&background=random' ? 1 : 0,
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
    const totalFields = Object.keys(profileFields).length;
    const filledFields = Object.values(profileFields).reduce((sum, val) => sum + val, 0);
    const profileCompletionPercentage = Math.round((filledFields / totalFields) * 100);

    res.status(200).json({
      success: true,
      user: {
        ...user.toObject(),
        enrollments,
        enrollmentCount: enrollments.length,
        profileCompletion: {
          percentage: profileCompletionPercentage,
          filledFields,
          totalFields,
          isComplete: profileCompletionPercentage === 100,
          rewardClaimed: user.profileCompletionRewardClaimed || false,
          rewardClaimedAt: user.profileCompletionRewardClaimedAt || null,
        },
      },
    });
  } catch (error) {
    console.error('Get user by ID error:', error);
    
    if (error.kind === 'ObjectId') {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error fetching user',
      error: error.message,
    });
  }
};

// @desc    Update user
// @route   PUT /api/admin/users/:id
// @access  Private/Admin
exports.updateUser = async (req, res) => {
  try {
    const { name, email, role, isActive } = req.body;

    let user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Update fields
    if (name) user.name = name;
    if (email) user.email = email;
    if (role) user.role = role;
    if (typeof isActive !== 'undefined') user.isActive = isActive;

    await user.save();

    res.status(200).json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isActive: user.isActive,
        avatar: user.avatar,
      },
      message: 'User updated successfully',
    });
  } catch (error) {
    console.error('Update user error:', error);
    
    if (error.kind === 'ObjectId') {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error updating user',
      error: error.message,
    });
  }
};

// @desc    Delete user
// @route   DELETE /api/admin/users/:id
// @access  Private/Admin
exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Prevent deleting yourself
    if (user._id.toString() === req.user.id) {
      return res.status(400).json({
        success: false,
        message: 'You cannot delete your own account',
      });
    }

    // Delete user's enrollments
    await Enrollment.deleteMany({ user: user._id });

    await user.deleteOne();

    res.status(200).json({
      success: true,
      message: 'User deleted successfully',
      data: {},
    });
  } catch (error) {
    console.error('Delete user error:', error);
    
    if (error.kind === 'ObjectId') {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error deleting user',
      error: error.message,
    });
  }
};

// @desc    Suspend/Unsuspend user
// @route   PATCH /api/admin/users/:id/suspend
// @access  Private/Admin
exports.toggleUserStatus = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Prevent suspending yourself
    if (user._id.toString() === req.user.id) {
      return res.status(400).json({
        success: false,
        message: 'You cannot suspend your own account',
      });
    }

    user.isActive = !user.isActive;
    await user.save();

    res.status(200).json({
      success: true,
      message: `User ${user.isActive ? 'activated' : 'suspended'} successfully`,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        isActive: user.isActive,
      },
    });
  } catch (error) {
    console.error('Toggle user status error:', error);
    
    if (error.kind === 'ObjectId') {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error updating user status',
      error: error.message,
    });
  }
};

// @desc    Get user statistics
// @route   GET /api/admin/users/stats
// @access  Private/Admin
exports.getUserStats = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const activeUsers = await User.countDocuments({ isActive: true });
    const suspendedUsers = await User.countDocuments({ isActive: false });
    const adminUsers = await User.countDocuments({ role: 'admin' });
    const regularUsers = await User.countDocuments({ role: 'user' });

    // Users by month (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const usersByMonth = await User.aggregate([
      {
        $match: {
          createdAt: { $gte: sixMonthsAgo },
        },
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
          },
          count: { $sum: 1 },
        },
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1 },
      },
    ]);

    res.status(200).json({
      success: true,
      stats: {
        totalUsers,
        activeUsers,
        suspendedUsers,
        adminUsers,
        regularUsers,
        usersByMonth,
      },
    });
  } catch (error) {
    console.error('Get user stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching user statistics',
      error: error.message,
    });
  }
};

