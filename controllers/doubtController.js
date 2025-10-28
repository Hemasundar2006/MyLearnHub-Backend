const Doubt = require('../models/Doubt');
const User = require('../models/User');
const Notification = require('../models/Notification');

// @desc    Submit a doubt
// @route   POST /api/doubts
// @access  Private
const submitDoubt = async (req, res) => {
  try {
    const { question } = req.body;
    const userId = req.user.id;

    // Validate input
    if (!question || question.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Question is required'
      });
    }

    if (question.length > 1000) {
      return res.status(400).json({
        success: false,
        message: 'Question cannot exceed 1000 characters'
      });
    }

    // Create doubt
    const doubt = new Doubt({
      question: question.trim(),
      askedBy: userId,
      status: 'pending'
    });

    await doubt.save();

    // Populate user details
    await doubt.populate('askedBy', 'name email');

    res.status(201).json({
      success: true,
      message: 'Doubt submitted successfully',
      data: doubt
    });
  } catch (error) {
    console.error('Submit doubt error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get user's doubts
// @route   GET /api/doubts/my-doubts
// @access  Private
const getUserDoubts = async (req, res) => {
  try {
    const userId = req.user.id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const status = req.query.status;

    // Build filter
    const filter = { askedBy: userId };
    if (status && ['pending', 'answered', 'closed'].includes(status)) {
      filter.status = status;
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
    console.error('Get user doubts error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get user's doubt statistics
// @route   GET /api/doubts/my-stats
// @access  Private
const getUserDoubtStats = async (req, res) => {
  try {
    const userId = req.user.id;

    // Get user with coin transactions
    const user = await User.findById(userId).select('coins coinTransactions');

    // Get doubt statistics
    const stats = await Doubt.aggregate([
      { $match: { askedBy: userId } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    // Calculate coins earned from doubts
    const doubtCoins = user.coinTransactions
      .filter(transaction => transaction.reason === 'Doubt answered')
      .reduce((total, transaction) => total + transaction.amount, 0);

    // Format stats
    const doubtStats = {
      total: 0,
      pending: 0,
      answered: 0,
      closed: 0
    };

    stats.forEach(stat => {
      doubtStats[stat._id] = stat.count;
      doubtStats.total += stat.count;
    });

    res.json({
      success: true,
      data: {
        doubtStats,
        coins: {
          total: user.coins,
          fromDoubts: doubtCoins
        }
      }
    });
  } catch (error) {
    console.error('Get user doubt stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Delete a doubt
// @route   DELETE /api/doubts/:id
// @access  Private
const deleteDoubt = async (req, res) => {
  try {
    const doubtId = req.params.id;
    const userId = req.user.id;

    // Find doubt
    const doubt = await Doubt.findById(doubtId);
    if (!doubt) {
      return res.status(404).json({
        success: false,
        message: 'Doubt not found'
      });
    }

    // Check if user owns the doubt
    if (doubt.askedBy.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this doubt'
      });
    }

    // Check if doubt can be deleted (only pending doubts)
    if (doubt.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Only pending doubts can be deleted'
      });
    }

    // Delete doubt
    await Doubt.findByIdAndDelete(doubtId);

    res.json({
      success: true,
      message: 'Doubt deleted successfully'
    });
  } catch (error) {
    console.error('Delete doubt error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get leaderboard
// @route   GET /api/doubts/leaderboard
// @access  Public
const getLeaderboard = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Get leaderboard
    const leaderboard = await User.find({ role: 'user' })
      .select('name email avatar coins createdAt')
      .sort({ coins: -1 })
      .skip(skip)
      .limit(limit);

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
    console.error('Get leaderboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

module.exports = {
  submitDoubt,
  getUserDoubts,
  getUserDoubtStats,
  deleteDoubt,
  getLeaderboard
};
