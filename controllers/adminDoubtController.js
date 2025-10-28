const Doubt = require('../models/Doubt');
const User = require('../models/User');
const Notification = require('../models/Notification');

// @desc    Get all doubts
// @route   GET /api/admin/doubts
// @access  Private/Admin
const getAllDoubts = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const status = req.query.status;
    const search = req.query.search;

    // Build filter
    const filter = {};
    if (status && ['pending', 'answered', 'closed'].includes(status)) {
      filter.status = status;
    }
    if (search) {
      filter.question = { $regex: search, $options: 'i' };
    }

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Get doubts
    const doubts = await Doubt.find(filter)
      .populate('askedBy', 'name email')
      .populate('adminResponse.answeredBy', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    // Get total count
    const total = await Doubt.countDocuments(filter);

    res.json({
      success: true,
      data: {
        doubts,
        pagination: {
          current: page,
          pages: Math.ceil(total / limit),
          total
        }
      }
    });
  } catch (error) {
    console.error('Get all doubts error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get doubt statistics
// @route   GET /api/admin/doubts/stats
// @access  Private/Admin
const getDoubtStats = async (req, res) => {
  try {
    // Get doubt statistics
    const stats = await Doubt.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    // Get total doubts
    const totalDoubts = await Doubt.countDocuments();

    // Get doubts by month (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const monthlyStats = await Doubt.aggregate([
      {
        $match: {
          createdAt: { $gte: sixMonthsAgo }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1 }
      }
    ]);

    // Get top users by doubts asked
    const topUsers = await Doubt.aggregate([
      {
        $group: {
          _id: '$askedBy',
          doubtCount: { $sum: 1 }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'user'
        }
      },
      {
        $unwind: '$user'
      },
      {
        $project: {
          name: '$user.name',
          email: '$user.email',
          doubtCount: 1
        }
      },
      {
        $sort: { doubtCount: -1 }
      },
      {
        $limit: 10
      }
    ]);

    // Format stats
    const doubtStats = {
      total: totalDoubts,
      pending: 0,
      answered: 0,
      closed: 0
    };

    stats.forEach(stat => {
      doubtStats[stat._id] = stat.count;
    });

    res.json({
      success: true,
      data: {
        doubtStats,
        monthlyStats,
        topUsers
      }
    });
  } catch (error) {
    console.error('Get doubt stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Answer a doubt
// @route   POST /api/admin/doubts/:id/answer
// @access  Private/Admin
const answerDoubt = async (req, res) => {
  try {
    const doubtId = req.params.id;
    const { title, description, url } = req.body;
    const adminId = req.user.id;

    // Validate input
    if (!title || !description) {
      return res.status(400).json({
        success: false,
        message: 'Title and description are required'
      });
    }

    if (title.length > 200) {
      return res.status(400).json({
        success: false,
        message: 'Title cannot exceed 200 characters'
      });
    }

    if (description.length > 2000) {
      return res.status(400).json({
        success: false,
        message: 'Description cannot exceed 2000 characters'
      });
    }

    if (url && !isValidUrl(url)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid URL format'
      });
    }

    // Find doubt
    const doubt = await Doubt.findById(doubtId);
    if (!doubt) {
      return res.status(404).json({
        success: false,
        message: 'Doubt not found'
      });
    }

    // Check if doubt is already answered
    if (doubt.status === 'answered' || doubt.status === 'closed') {
      return res.status(400).json({
        success: false,
        message: 'Doubt is already answered or closed'
      });
    }

    // Update doubt with admin response
    doubt.status = 'answered';
    doubt.adminResponse = {
      title: title.trim(),
      description: description.trim(),
      url: url ? url.trim() : undefined,
      answeredBy: adminId,
      answeredAt: new Date()
    };

    await doubt.save();

    // Award coins to user
    const user = await User.findById(doubt.askedBy);
    if (user) {
      const coinsToAward = 10;
      user.coins += coinsToAward;
      user.coinTransactions.push({
        amount: coinsToAward,
        type: 'earned',
        reason: 'Doubt answered',
        timestamp: new Date()
      });
      await user.save();

      // Create notification
      await Notification.create({
        user: doubt.askedBy,
        title: 'Doubt Answered',
        message: `Your doubt "${doubt.question.substring(0, 50)}..." has been answered!`,
        type: 'doubt_answered',
        data: {
          doubtId: doubt._id,
          question: doubt.question,
          answer: {
            title: doubt.adminResponse.title,
            description: doubt.adminResponse.description,
            url: doubt.adminResponse.url
          }
        }
      });
    }

    // Populate response
    await doubt.populate('askedBy', 'name email');
    await doubt.populate('adminResponse.answeredBy', 'name email');

    res.json({
      success: true,
      message: 'Doubt answered successfully',
      data: {
        ...doubt.toObject(),
        coinsAwarded: 10,
        isCoinsAwarded: true
      }
    });
  } catch (error) {
    console.error('Answer doubt error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Close a doubt
// @route   POST /api/admin/doubts/:id/close
// @access  Private/Admin
const closeDoubt = async (req, res) => {
  try {
    const doubtId = req.params.id;
    const adminId = req.user.id;

    // Find doubt
    const doubt = await Doubt.findById(doubtId);
    if (!doubt) {
      return res.status(404).json({
        success: false,
        message: 'Doubt not found'
      });
    }

    // Check if doubt is already closed
    if (doubt.status === 'closed') {
      return res.status(400).json({
        success: false,
        message: 'Doubt is already closed'
      });
    }

    // Update doubt status
    doubt.status = 'closed';
    await doubt.save();

    // Create notification
    await Notification.create({
      user: doubt.askedBy,
      title: 'Doubt Closed',
      message: `Your doubt "${doubt.question.substring(0, 50)}..." has been closed.`,
      type: 'doubt_closed',
      data: {
        doubtId: doubt._id,
        question: doubt.question
      }
    });

    // Populate response
    await doubt.populate('askedBy', 'name email');
    await doubt.populate('adminResponse.answeredBy', 'name email');

    res.json({
      success: true,
      message: 'Doubt closed successfully',
      data: doubt
    });
  } catch (error) {
    console.error('Close doubt error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get doubt leaderboard
// @route   GET /api/admin/doubts/leaderboard
// @access  Private/Admin
const getDoubtLeaderboard = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Get leaderboard with doubt metrics
    const leaderboard = await User.aggregate([
      {
        $match: { role: 'user' }
      },
      {
        $lookup: {
          from: 'doubts',
          localField: '_id',
          foreignField: 'askedBy',
          as: 'doubts'
        }
      },
      {
        $addFields: {
          doubtCount: { $size: '$doubts' },
          answeredDoubts: {
            $size: {
              $filter: {
                input: '$doubts',
                cond: { $eq: ['$$this.status', 'answered'] }
              }
            }
          }
        }
      },
      {
        $project: {
          name: 1,
          email: 1,
          avatar: 1,
          coins: 1,
          doubtCount: 1,
          answeredDoubts: 1,
          createdAt: 1
        }
      },
      {
        $sort: { coins: -1 }
      },
      {
        $skip: skip
      },
      {
        $limit: limit
      }
    ]);

    // Get total count
    const total = await User.countDocuments({ role: 'user' });

    res.json({
      success: true,
      data: {
        leaderboard,
        pagination: {
          current: page,
          pages: Math.ceil(total / limit),
          total
        }
      }
    });
  } catch (error) {
    console.error('Get doubt leaderboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// Helper function to validate URL
const isValidUrl = (string) => {
  try {
    new URL(string);
    return true;
  } catch (_) {
    return false;
  }
};

module.exports = {
  getAllDoubts,
  getDoubtStats,
  answerDoubt,
  closeDoubt,
  getDoubtLeaderboard
};