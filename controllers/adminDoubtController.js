const Doubt = require('../models/Doubt');
const User = require('../models/User');
const Notification = require('../models/Notification');

// @desc    Get all doubts for admin
// @route   GET /api/admin/doubts
// @access  Private (Admin)
exports.getAllDoubts = async (req, res) => {
  try {
    const { page = 1, limit = 10, status, search } = req.query;
    const skip = (page - 1) * limit;

    // Build query
    const query = {};
    if (status && ['pending', 'answered', 'closed'].includes(status)) {
      query.status = status;
    }

    // Search in question text
    if (search) {
      query.question = { $regex: search, $options: 'i' };
    }

    const doubts = await Doubt.find(query)
      .populate('askedBy', 'name email avatar')
      .populate('adminResponse.answeredBy', 'name email avatar')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Doubt.countDocuments(query);

    res.json({
      success: true,
      data: {
        doubts,
        pagination: {
          current: parseInt(page),
          pages: Math.ceil(total / limit),
          total,
        },
      },
    });
  } catch (error) {
    console.error('Get all doubts error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching doubts',
      error: error.message,
    });
  }
};

// @desc    Get doubt statistics for admin
// @route   GET /api/admin/doubts/stats
// @access  Private (Admin)
exports.getDoubtStats = async (req, res) => {
  try {
    const stats = await Doubt.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
        },
      },
    ]);

    const totalDoubts = await Doubt.countDocuments();
    const totalCoinsAwarded = await Doubt.aggregate([
      { $match: { isCoinsAwarded: true } },
      { $group: { _id: null, total: { $sum: '$coinsAwarded' } } },
    ]);

    const statusCounts = {
      pending: 0,
      answered: 0,
      closed: 0,
    };

    stats.forEach((stat) => {
      statusCounts[stat._id] = stat.count;
    });

    // Get recent activity (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const recentActivity = await Doubt.aggregate([
      {
        $match: {
          createdAt: { $gte: sevenDaysAgo },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$createdAt' },
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    res.json({
      success: true,
      data: {
        totalDoubts,
        statusCounts,
        totalCoinsAwarded: totalCoinsAwarded[0]?.total || 0,
        recentActivity,
      },
    });
  } catch (error) {
    console.error('Get doubt stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching doubt statistics',
      error: error.message,
    });
  }
};

// @desc    Answer a doubt
// @route   POST /api/admin/doubts/:id/answer
// @access  Private (Admin)
exports.answerDoubt = async (req, res) => {
  try {
    const { title, description, url } = req.body;
    const doubtId = req.params.id;

    if (!title || !description) {
      return res.status(400).json({
        success: false,
        message: 'Title and description are required',
      });
    }

    const doubt = await Doubt.findById(doubtId);

    if (!doubt) {
      return res.status(404).json({
        success: false,
        message: 'Doubt not found',
      });
    }

    if (doubt.status === 'answered' || doubt.status === 'closed') {
      return res.status(400).json({
        success: false,
        message: 'Doubt has already been answered or closed',
      });
    }

    // Update doubt with admin response
    const updatedDoubt = await Doubt.findByIdAndUpdate(
      doubtId,
      {
        status: 'answered',
        adminResponse: {
          title: title.trim(),
          description: description.trim(),
          url: url ? url.trim() : undefined,
          answeredBy: req.user._id,
          answeredAt: new Date(),
        },
        coinsAwarded: 10, // Award 10 coins
        isCoinsAwarded: true,
      },
      { new: true }
    ).populate('askedBy', 'name email avatar')
     .populate('adminResponse.answeredBy', 'name email avatar');

    // Transfer 10 coins from admin to user
    const { transferCoinsFromAdmin } = require('../utils/coinTransfer');
    
    let coinTransferResult = null;
    try {
      coinTransferResult = await transferCoinsFromAdmin(
        doubt.askedBy,
        10,
        'Doubt answered by admin',
        null,
        doubtId
      );
    } catch (error) {
      console.error('Coin transfer failed:', error.message);
      // Continue with doubt answering even if coin transfer fails
    }

    // Create notification for the user
    await Notification.create({
      user: doubt.askedBy,
      title: 'Your doubt has been answered!',
      message: `Admin has answered your doubt: "${doubt.question.substring(0, 50)}..."`,
      type: 'doubt_answered',
      data: {
        doubtId: doubt._id,
        adminResponse: updatedDoubt.adminResponse,
      },
    });

    res.json({
      success: true,
      message: 'Doubt answered successfully',
      data: updatedDoubt,
    });
  } catch (error) {
    console.error('Answer doubt error:', error);
    res.status(500).json({
      success: false,
      message: 'Error answering doubt',
      error: error.message,
    });
  }
};

// @desc    Close a doubt
// @route   POST /api/admin/doubts/:id/close
// @access  Private (Admin)
exports.closeDoubt = async (req, res) => {
  try {
    const doubtId = req.params.id;

    const doubt = await Doubt.findById(doubtId);

    if (!doubt) {
      return res.status(404).json({
        success: false,
        message: 'Doubt not found',
      });
    }

    if (doubt.status === 'closed') {
      return res.status(400).json({
        success: false,
        message: 'Doubt is already closed',
      });
    }

    const updatedDoubt = await Doubt.findByIdAndUpdate(
      doubtId,
      { status: 'closed' },
      { new: true }
    ).populate('askedBy', 'name email avatar')
     .populate('adminResponse.answeredBy', 'name email avatar');

    // Create notification for the user
    await Notification.create({
      user: doubt.askedBy,
      title: 'Doubt closed',
      message: `Your doubt has been closed: "${doubt.question.substring(0, 50)}..."`,
      type: 'doubt_closed',
      data: {
        doubtId: doubt._id,
      },
    });

    res.json({
      success: true,
      message: 'Doubt closed successfully',
      data: updatedDoubt,
    });
  } catch (error) {
    console.error('Close doubt error:', error);
    res.status(500).json({
      success: false,
      message: 'Error closing doubt',
      error: error.message,
    });
  }
};

// @desc    Get doubt leaderboard for admin
// @route   GET /api/admin/doubts/leaderboard
// @access  Private (Admin)
exports.getDoubtLeaderboard = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;

    // Get users with their doubt-related statistics
    const leaderboard = await User.aggregate([
      {
        $lookup: {
          from: 'doubts',
          localField: '_id',
          foreignField: 'askedBy',
          as: 'doubts',
        },
      },
      {
        $addFields: {
          totalDoubts: { $size: '$doubts' },
          answeredDoubts: {
            $size: {
              $filter: {
                input: '$doubts',
                cond: { $eq: ['$$this.status', 'answered'] },
              },
            },
          },
          pendingDoubts: {
            $size: {
              $filter: {
                input: '$doubts',
                cond: { $eq: ['$$this.status', 'pending'] },
              },
            },
          },
          doubtCoins: {
            $sum: {
              $map: {
                input: '$doubts',
                as: 'doubt',
                in: {
                  $cond: [
                    { $eq: ['$$doubt.isCoinsAwarded', true] },
                    '$$doubt.coinsAwarded',
                    0,
                  ],
                },
              },
            },
          },
        },
      },
      {
        $addFields: {
          totalCoins: { $add: ['$coins', '$doubtCoins'] },
        },
      },
      {
        $match: {
          isActive: true,
          role: 'user',
          totalDoubts: { $gt: 0 }, // Only users who have asked doubts
        },
      },
      {
        $project: {
          name: 1,
          email: 1,
          avatar: 1,
          coins: 1,
          doubtCoins: 1,
          totalCoins: 1,
          totalDoubts: 1,
          answeredDoubts: 1,
          pendingDoubts: 1,
          createdAt: 1,
        },
      },
      {
        $sort: { totalCoins: -1, totalDoubts: -1, createdAt: 1 },
      },
      {
        $skip: skip,
      },
      {
        $limit: parseInt(limit),
      },
    ]);

    const totalUsers = await User.countDocuments({
      isActive: true,
      role: 'user',
    });

    res.json({
      success: true,
      data: {
        leaderboard,
        pagination: {
          current: parseInt(page),
          pages: Math.ceil(totalUsers / limit),
          total: totalUsers,
        },
      },
    });
  } catch (error) {
    console.error('Get doubt leaderboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching doubt leaderboard',
      error: error.message,
    });
  }
};