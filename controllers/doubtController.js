const Doubt = require('../models/Doubt');
const User = require('../models/User');
const Notification = require('../models/Notification');

// @desc    Submit a doubt
// @route   POST /api/doubts
// @access  Private
exports.submitDoubt = async (req, res) => {
  try {
    const { question } = req.body;

    if (!question || question.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a question',
      });
    }

    const doubt = await Doubt.create({
      question: question.trim(),
      askedBy: req.user._id,
    });

    // Populate the user details
    await doubt.populate('askedBy', 'name email avatar');

    res.status(201).json({
      success: true,
      message: 'Doubt submitted successfully',
      data: doubt,
    });
  } catch (error) {
    console.error('Submit doubt error:', error);
    res.status(500).json({
      success: false,
      message: 'Error submitting doubt',
      error: error.message,
    });
  }
};

// @desc    Get user's doubts
// @route   GET /api/doubts/my-doubts
// @access  Private
exports.getUserDoubts = async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    const skip = (page - 1) * limit;

    // Build query
    const query = { askedBy: req.user._id };
    if (status && ['pending', 'answered', 'closed'].includes(status)) {
      query.status = status;
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
    console.error('Get user doubts error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching doubts',
      error: error.message,
    });
  }
};

// @desc    Get user's doubt statistics
// @route   GET /api/doubts/my-stats
// @access  Private
exports.getUserDoubtStats = async (req, res) => {
  try {
    const userId = req.user._id;

    const stats = await Doubt.aggregate([
      { $match: { askedBy: userId } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
        },
      },
    ]);

    const totalDoubts = await Doubt.countDocuments({ askedBy: userId });
    const totalCoinsEarned = await Doubt.aggregate([
      { $match: { askedBy: userId, isCoinsAwarded: true } },
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

    res.json({
      success: true,
      data: {
        totalDoubts,
        statusCounts,
        totalCoinsEarned: totalCoinsEarned[0]?.total || 0,
      },
    });
  } catch (error) {
    console.error('Get user doubt stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching doubt statistics',
      error: error.message,
    });
  }
};

// @desc    Delete a doubt
// @route   DELETE /api/doubts/:id
// @access  Private
exports.deleteDoubt = async (req, res) => {
  try {
    const doubt = await Doubt.findById(req.params.id);

    if (!doubt) {
      return res.status(404).json({
        success: false,
        message: 'Doubt not found',
      });
    }

    // Check if user owns the doubt
    if (doubt.askedBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this doubt',
      });
    }

    // Only allow deletion of pending doubts
    if (doubt.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Only pending doubts can be deleted',
      });
    }

    await Doubt.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Doubt deleted successfully',
    });
  } catch (error) {
    console.error('Delete doubt error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting doubt',
      error: error.message,
    });
  }
};

// @desc    Get leaderboard
// @route   GET /api/doubts/leaderboard
// @access  Public
exports.getLeaderboard = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;

    // Get users with their total coins from doubts
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
          createdAt: 1,
        },
      },
      {
        $sort: { totalCoins: -1, createdAt: 1 },
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
    console.error('Get leaderboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching leaderboard',
      error: error.message,
    });
  }
};