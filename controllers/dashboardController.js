const User = require('../models/User');
const Course = require('../models/Course');
const Enrollment = require('../models/Enrollment');
const { getAdminCoinBalance } = require('../utils/coinTransfer');

// @desc    Get dashboard statistics
// @route   GET /api/admin/dashboard/stats
// @access  Private/Admin
exports.getDashboardStats = async (req, res) => {
  try {
    // Get current date and 30 days ago for growth calculation
    const now = new Date();
    const thirtyDaysAgo = new Date(now.setDate(now.getDate() - 30));
    const sixtyDaysAgo = new Date(now.setDate(now.getDate() - 30));

    // Total counts
    const totalUsers = await User.countDocuments();
    const totalCourses = await Course.countDocuments();
    const totalEnrollments = await Enrollment.countDocuments();

    // Users in last 30 days
    const usersLast30Days = await User.countDocuments({
      createdAt: { $gte: thirtyDaysAgo },
    });
    const usersPrevious30Days = await User.countDocuments({
      createdAt: { $gte: sixtyDaysAgo, $lt: thirtyDaysAgo },
    });

    // Calculate growth rates
    const userGrowthRate = usersPrevious30Days > 0
      ? ((usersLast30Days - usersPrevious30Days) / usersPrevious30Days * 100).toFixed(2)
      : 100;

    // Courses in last 30 days
    const coursesLast30Days = await Course.countDocuments({
      createdAt: { $gte: thirtyDaysAgo },
    });

    // Enrollments in last 30 days
    const enrollmentsLast30Days = await Enrollment.countDocuments({
      enrolledAt: { $gte: thirtyDaysAgo },
    });
    const enrollmentsPrevious30Days = await Enrollment.countDocuments({
      enrolledAt: { $gte: sixtyDaysAgo, $lt: thirtyDaysAgo },
    });

    const enrollmentGrowthRate = enrollmentsPrevious30Days > 0
      ? ((enrollmentsLast30Days - enrollmentsPrevious30Days) / enrollmentsPrevious30Days * 100).toFixed(2)
      : 100;

    // Calculate total revenue (assuming each enrollment is course price)
    const enrollmentsWithCourses = await Enrollment.find()
      .populate('course', 'price');
    
    const totalRevenue = enrollmentsWithCourses.reduce((sum, enrollment) => {
      return sum + (enrollment.course?.price || 0);
    }, 0);

    // Revenue last 30 days
    const recentEnrollments = await Enrollment.find({
      enrolledAt: { $gte: thirtyDaysAgo },
    }).populate('course', 'price');

    const revenueThisMonth = recentEnrollments.reduce((sum, enrollment) => {
      return sum + (enrollment.course?.price || 0);
    }, 0);

    const previousEnrollments = await Enrollment.find({
      enrolledAt: { $gte: sixtyDaysAgo, $lt: thirtyDaysAgo },
    }).populate('course', 'price');

    const revenuePrevMonth = previousEnrollments.reduce((sum, enrollment) => {
      return sum + (enrollment.course?.price || 0);
    }, 0);

    const revenueGrowthRate = revenuePrevMonth > 0
      ? ((revenueThisMonth - revenuePrevMonth) / revenuePrevMonth * 100).toFixed(2)
      : 100;

    // Get admin coin balance
    const adminCoinBalance = await getAdminCoinBalance();

    res.status(200).json({
      success: true,
      stats: {
        totalUsers,
        totalCourses,
        totalEnrollments,
        totalRevenue,
        usersThisMonth: usersLast30Days,
        coursesThisMonth: coursesLast30Days,
        enrollmentsThisMonth: enrollmentsLast30Days,
        revenueThisMonth,
        adminCoinBalance,
        growthRates: {
          users: parseFloat(userGrowthRate),
          enrollments: parseFloat(enrollmentGrowthRate),
          revenue: parseFloat(revenueGrowthRate),
        },
      },
    });
  } catch (error) {
    console.error('Get dashboard stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching dashboard statistics',
      error: error.message,
    });
  }
};

// @desc    Get recent activity
// @route   GET /api/admin/dashboard/activity
// @access  Private/Admin
exports.getRecentActivity = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;

    // Get recent enrollments
    const recentEnrollments = await Enrollment.find()
      .sort({ enrolledAt: -1 })
      .limit(limit)
      .populate('user', 'name email avatar')
      .populate('course', 'title');

    // Get recent users
    const recentUsers = await User.find()
      .sort({ createdAt: -1 })
      .limit(limit)
      .select('name email avatar role createdAt');

    // Get recent courses
    const recentCourses = await Course.find()
      .sort({ createdAt: -1 })
      .limit(limit)
      .select('title instructor createdAt status')
      .populate('createdBy', 'name');

    // Combine and format activity
    const activity = [
      ...recentEnrollments.map(e => ({
        type: 'enrollment',
        message: `${e.user?.name} enrolled in ${e.course?.title}`,
        user: e.user,
        timestamp: e.enrolledAt,
        icon: 'book',
      })),
      ...recentUsers.map(u => ({
        type: 'user',
        message: `${u.name} joined the platform`,
        user: u,
        timestamp: u.createdAt,
        icon: 'user',
      })),
      ...recentCourses.map(c => ({
        type: 'course',
        message: `New course "${c.title}" ${c.status === 'published' ? 'published' : 'created'} by ${c.createdBy?.name || c.instructor}`,
        timestamp: c.createdAt,
        icon: 'video',
      })),
    ];

    // Sort by timestamp and limit
    activity.sort((a, b) => b.timestamp - a.timestamp);
    const limitedActivity = activity.slice(0, limit);

    res.status(200).json({
      success: true,
      count: limitedActivity.length,
      activity: limitedActivity,
    });
  } catch (error) {
    console.error('Get recent activity error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching recent activity',
      error: error.message,
    });
  }
};

// @desc    Get performance metrics
// @route   GET /api/admin/dashboard/metrics
// @access  Private/Admin
exports.getPerformanceMetrics = async (req, res) => {
  try {
    // Active users (logged in last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const activeUsers = await User.countDocuments({
      updatedAt: { $gte: sevenDaysAgo },
    });

    // Course completion rate
    const completedEnrollments = await Enrollment.countDocuments({
      status: 'completed',
    });
    const totalEnrollments = await Enrollment.countDocuments();
    const completionRate = totalEnrollments > 0
      ? ((completedEnrollments / totalEnrollments) * 100).toFixed(2)
      : 0;

    // Average course rating
    const courses = await Course.find({ rating: { $gt: 0 } });
    const avgRating = courses.length > 0
      ? (courses.reduce((sum, c) => sum + c.rating, 0) / courses.length).toFixed(2)
      : 0;

    // Popular courses
    const popularCourses = await Course.find()
      .sort({ enrolledCount: -1 })
      .limit(5)
      .select('title enrolledCount rating');

    // User retention (users who enrolled in multiple courses)
    const retentionData = await Enrollment.aggregate([
      { $group: { _id: '$user', courseCount: { $sum: 1 } } },
      { $match: { courseCount: { $gt: 1 } } },
      { $count: 'retainedUsers' },
    ]);

    const retainedUsers = retentionData[0]?.retainedUsers || 0;
    const totalUsers = await User.countDocuments();
    const retentionRate = totalUsers > 0
      ? ((retainedUsers / totalUsers) * 100).toFixed(2)
      : 0;

    res.status(200).json({
      success: true,
      metrics: {
        activeUsers,
        completionRate: parseFloat(completionRate),
        averageRating: parseFloat(avgRating),
        retentionRate: parseFloat(retentionRate),
        popularCourses,
      },
    });
  } catch (error) {
    console.error('Get performance metrics error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching performance metrics',
      error: error.message,
    });
  }
};

