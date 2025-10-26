const User = require('../models/User');
const Course = require('../models/Course');
const Enrollment = require('../models/Enrollment');

// @desc    Get analytics overview
// @route   GET /api/admin/analytics/overview
// @access  Private/Admin
exports.getAnalyticsOverview = async (req, res) => {
  try {
    const { period = '30' } = req.query; // days
    
    const daysAgo = new Date();
    daysAgo.setDate(daysAgo.getDate() - parseInt(period));

    // Revenue analytics
    const enrollmentsWithCourses = await Enrollment.find({
      enrolledAt: { $gte: daysAgo },
    }).populate('course', 'price');

    const revenue = enrollmentsWithCourses.reduce((sum, e) => {
      return sum + (e.course?.price || 0);
    }, 0);

    // User growth
    const newUsers = await User.countDocuments({
      createdAt: { $gte: daysAgo },
    });

    // Course enrollment
    const newEnrollments = await Enrollment.countDocuments({
      enrolledAt: { $gte: daysAgo },
    });

    // Active courses
    const activeCourses = await Course.countDocuments({
      status: 'published',
      createdAt: { $gte: daysAgo },
    });

    res.status(200).json({
      success: true,
      period: `${period} days`,
      analytics: {
        revenue,
        newUsers,
        newEnrollments,
        activeCourses,
      },
    });
  } catch (error) {
    console.error('Get analytics overview error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching analytics',
      error: error.message,
    });
  }
};

// @desc    Get revenue analytics
// @route   GET /api/admin/analytics/revenue
// @access  Private/Admin
exports.getRevenueAnalytics = async (req, res) => {
  try {
    const { period = '30' } = req.query;
    
    const daysAgo = new Date();
    daysAgo.setDate(daysAgo.getDate() - parseInt(period));

    // Revenue by day
    const enrollments = await Enrollment.find({
      enrolledAt: { $gte: daysAgo },
    }).populate('course', 'price title category');

    // Group by date
    const revenueByDate = {};
    enrollments.forEach(enrollment => {
      const date = enrollment.enrolledAt.toISOString().split('T')[0];
      if (!revenueByDate[date]) {
        revenueByDate[date] = 0;
      }
      revenueByDate[date] += enrollment.course?.price || 0;
    });

    // Revenue by category
    const revenueByCategory = {};
    enrollments.forEach(enrollment => {
      const category = enrollment.course?.category || 'Uncategorized';
      if (!revenueByCategory[category]) {
        revenueByCategory[category] = 0;
      }
      revenueByCategory[category] += enrollment.course?.price || 0;
    });

    // Total revenue
    const totalRevenue = enrollments.reduce((sum, e) => {
      return sum + (e.course?.price || 0);
    }, 0);

    // Average order value
    const averageOrderValue = enrollments.length > 0
      ? totalRevenue / enrollments.length
      : 0;

    res.status(200).json({
      success: true,
      revenue: {
        total: totalRevenue,
        average: averageOrderValue.toFixed(2),
        byDate: revenueByDate,
        byCategory: revenueByCategory,
        transactions: enrollments.length,
      },
    });
  } catch (error) {
    console.error('Get revenue analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching revenue analytics',
      error: error.message,
    });
  }
};

// @desc    Get user analytics
// @route   GET /api/admin/analytics/users
// @access  Private/Admin
exports.getUserAnalytics = async (req, res) => {
  try {
    const { period = '30' } = req.query;
    
    const daysAgo = new Date();
    daysAgo.setDate(daysAgo.getDate() - parseInt(period));

    // User growth by date
    const users = await User.find({
      createdAt: { $gte: daysAgo },
    });

    const usersByDate = {};
    users.forEach(user => {
      const date = user.createdAt.toISOString().split('T')[0];
      if (!usersByDate[date]) {
        usersByDate[date] = 0;
      }
      usersByDate[date]++;
    });

    // Active users (users with enrollments in period)
    const activeUserIds = await Enrollment.distinct('user', {
      enrolledAt: { $gte: daysAgo },
    });

    // User retention
    const totalUsers = await User.countDocuments();
    const retentionRate = totalUsers > 0
      ? ((activeUserIds.length / totalUsers) * 100).toFixed(2)
      : 0;

    res.status(200).json({
      success: true,
      users: {
        newUsers: users.length,
        activeUsers: activeUserIds.length,
        retentionRate: parseFloat(retentionRate),
        byDate: usersByDate,
      },
    });
  } catch (error) {
    console.error('Get user analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching user analytics',
      error: error.message,
    });
  }
};

// @desc    Get course analytics
// @route   GET /api/admin/analytics/courses
// @access  Private/Admin
exports.getCourseAnalytics = async (req, res) => {
  try {
    const { period = '30' } = req.query;
    
    const daysAgo = new Date();
    daysAgo.setDate(daysAgo.getDate() - parseInt(period));

    // Top courses by enrollment
    const topCoursesByEnrollment = await Course.find({
      status: 'published',
    })
      .sort({ enrolledCount: -1 })
      .limit(10)
      .select('title enrolledCount rating price category');

    // Top courses by revenue
    const enrollmentsGrouped = await Enrollment.aggregate([
      {
        $match: {
          enrolledAt: { $gte: daysAgo },
        },
      },
      {
        $group: {
          _id: '$course',
          enrollmentCount: { $sum: 1 },
        },
      },
      {
        $sort: { enrollmentCount: -1 },
      },
      {
        $limit: 10,
      },
    ]);

    // Populate course details
    const topCoursesByRevenue = await Course.populate(enrollmentsGrouped, {
      path: '_id',
      select: 'title price enrolledCount rating',
    });

    const revenueData = topCoursesByRevenue.map(item => ({
      course: item._id,
      enrollments: item.enrollmentCount,
      revenue: (item._id?.price || 0) * item.enrollmentCount,
    }));

    // Course completion rates
    const completionData = await Enrollment.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
        },
      },
    ]);

    const completionStats = {};
    completionData.forEach(item => {
      completionStats[item._id] = item.count;
    });

    res.status(200).json({
      success: true,
      courses: {
        topByEnrollment: topCoursesByEnrollment,
        topByRevenue: revenueData,
        completionStats,
      },
    });
  } catch (error) {
    console.error('Get course analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching course analytics',
      error: error.message,
    });
  }
};

// @desc    Get enrollment analytics
// @route   GET /api/admin/analytics/enrollments
// @access  Private/Admin
exports.getEnrollmentAnalytics = async (req, res) => {
  try {
    const { period = '30' } = req.query;
    
    const daysAgo = new Date();
    daysAgo.setDate(daysAgo.getDate() - parseInt(period));

    // Enrollments by date
    const enrollments = await Enrollment.find({
      enrolledAt: { $gte: daysAgo },
    });

    const enrollmentsByDate = {};
    enrollments.forEach(enrollment => {
      const date = enrollment.enrolledAt.toISOString().split('T')[0];
      if (!enrollmentsByDate[date]) {
        enrollmentsByDate[date] = 0;
      }
      enrollmentsByDate[date]++;
    });

    // Enrollments by status
    const enrollmentsByStatus = await Enrollment.aggregate([
      {
        $match: {
          enrolledAt: { $gte: daysAgo },
        },
      },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
        },
      },
    ]);

    // Average progress
    const progressData = await Enrollment.aggregate([
      {
        $group: {
          _id: null,
          avgProgress: { $avg: '$progress' },
        },
      },
    ]);

    const averageProgress = progressData[0]?.avgProgress || 0;

    res.status(200).json({
      success: true,
      enrollments: {
        total: enrollments.length,
        byDate: enrollmentsByDate,
        byStatus: enrollmentsByStatus,
        averageProgress: averageProgress.toFixed(2),
      },
    });
  } catch (error) {
    console.error('Get enrollment analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching enrollment analytics',
      error: error.message,
    });
  }
};

