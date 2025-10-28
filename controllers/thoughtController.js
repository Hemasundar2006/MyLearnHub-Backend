const Thought = require('../models/Thought');
const User = require('../models/User');

// @desc    Get approved thoughts (public)
// @route   GET /api/thoughts/approved
// @access  Public
exports.getApprovedThoughts = async (req, res) => {
  try {
    const { search, page = 1, limit = 20 } = req.query;

    const query = { status: 'approved' };

    if (search && search.trim() !== '') {
      const searchRegex = new RegExp(search.trim(), 'i');
      query.$or = [{ title: searchRegex }, { message: searchRegex }];
    }

    const parsedPage = parseInt(page);
    const parsedLimit = parseInt(limit);
    const skip = (parsedPage - 1) * parsedLimit;

    const [thoughts, total] = await Promise.all([
      Thought.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parsedLimit)
        .populate('submittedBy', 'name'),
      Thought.countDocuments(query),
    ]);

    const formatted = thoughts.map((t) => ({
      id: t._id,
      title: t.title,
      message: t.message,
      submittedBy: t.submittedBy ? { name: t.submittedBy.name } : null,
      createdAt: t.createdAt,
    }));

    res.status(200).json({
      success: true,
      data: {
        thoughts: formatted,
        pagination: {
          page: parsedPage,
          limit: parsedLimit,
          total,
          pages: Math.ceil(total / parsedLimit),
        },
      },
    });
  } catch (error) {
    console.error('Get approved thoughts error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching approved thoughts',
      error: error.message,
    });
  }
};

// @desc    Submit a new thought
// @route   POST /api/thoughts
// @access  Private (User)
exports.submitThought = async (req, res) => {
  try {
    const { title, message } = req.body;

    // Validate required fields
    if (!title || !message) {
      return res.status(400).json({
        success: false,
        message: 'Please provide title and message',
      });
    }

    // Create thought
    const thought = await Thought.create({
      title: title.trim(),
      message: message.trim(),
      submittedBy: req.user.id,
      status: 'pending',
    });

    // Populate submittedBy user info
    await thought.populate('submittedBy', 'name email');

    res.status(201).json({
      success: true,
      message: 'Your thought has been submitted successfully and is pending admin approval',
      data: {
        thought: {
          id: thought._id,
          title: thought.title,
          message: thought.message,
          status: thought.status,
          submittedBy: {
            id: thought.submittedBy._id,
            name: thought.submittedBy.name,
            email: thought.submittedBy.email,
          },
          createdAt: thought.createdAt,
        },
      },
    });
  } catch (error) {
    console.error('Submit thought error:', error);
    
    // Handle validation errors
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: messages.join(', '),
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error submitting thought',
      error: error.message,
    });
  }
};

// @desc    Get user's own thoughts
// @route   GET /api/thoughts/my-thoughts
// @access  Private (User)
exports.getUserThoughts = async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;

    let query = {
      submittedBy: req.user.id,
    };

    // Filter by status if provided
    if (status && ['pending', 'approved', 'rejected'].includes(status)) {
      query.status = status;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Get thoughts with pagination
    const thoughts = await Thought.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate('reviewedBy', 'name email')
      .populate('notificationId', 'title type sentAt');

    // Get total count
    const total = await Thought.countDocuments(query);

    // Format response
    const formattedThoughts = thoughts.map(thought => ({
      id: thought._id,
      title: thought.title,
      message: thought.message,
      status: thought.status,
      reviewedBy: thought.reviewedBy ? {
        name: thought.reviewedBy.name,
        email: thought.reviewedBy.email,
      } : null,
      reviewedAt: thought.reviewedAt,
      reviewNotes: thought.reviewNotes,
      notificationId: thought.notificationId?._id,
      notificationSentAt: thought.notificationId?.sentAt,
      createdAt: thought.createdAt,
      updatedAt: thought.updatedAt,
    }));

    res.status(200).json({
      success: true,
      data: {
        thoughts: formattedThoughts,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit)),
        },
      },
    });
  } catch (error) {
    console.error('Get user thoughts error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching thoughts',
      error: error.message,
    });
  }
};

// @desc    Get user's thought statistics
// @route   GET /api/thoughts/my-stats
// @access  Private (User)
exports.getUserThoughtStats = async (req, res) => {
  try {
    const userId = req.user.id;

    // Get counts by status
    const [pending, approved, rejected, total] = await Promise.all([
      Thought.countDocuments({ submittedBy: userId, status: 'pending' }),
      Thought.countDocuments({ submittedBy: userId, status: 'approved' }),
      Thought.countDocuments({ submittedBy: userId, status: 'rejected' }),
      Thought.countDocuments({ submittedBy: userId }),
    ]);

    res.status(200).json({
      success: true,
      data: {
        stats: {
          total,
          pending,
          approved,
          rejected,
        },
      },
    });
  } catch (error) {
    console.error('Get user thought stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching thought statistics',
      error: error.message,
    });
  }
};

// @desc    Delete user's own thought (only if pending)
// @route   DELETE /api/thoughts/:id
// @access  Private (User)
exports.deleteThought = async (req, res) => {
  try {
    const mongoose = require('mongoose');
    
    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid thought ID format',
      });
    }

    const thought = await Thought.findById(req.params.id);

    if (!thought) {
      return res.status(404).json({
        success: false,
        message: 'Thought not found',
      });
    }

    // Check if user owns this thought
    if (thought.submittedBy.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this thought',
      });
    }

    // Only allow deletion of pending thoughts
    if (thought.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: `Cannot delete ${thought.status} thoughts`,
      });
    }

    await thought.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Thought deleted successfully',
    });
  } catch (error) {
    console.error('Delete thought error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error deleting thought',
      error: error.message,
    });
  }
};

// @desc    Get user's coin balance
// @route   GET /api/thoughts/coins
// @access  Private (User)
exports.getCoinBalance = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('coins name email');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    res.status(200).json({
      success: true,
      data: {
        coins: user.coins,
        user: {
          name: user.name,
          email: user.email,
        },
      },
    });
  } catch (error) {
    console.error('Get coin balance error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching coin balance',
      error: error.message,
    });
  }
};

// @desc    Get user's coin transaction history
// @route   GET /api/thoughts/coins/transactions
// @access  Private (User)
exports.getCoinTransactions = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;

    const user = await User.findById(req.user.id)
      .select('coins coinTransactions')
      .populate('coinTransactions.relatedThought', 'title status');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Sort transactions by timestamp (newest first)
    const sortedTransactions = user.coinTransactions.sort(
      (a, b) => new Date(b.timestamp) - new Date(a.timestamp)
    );

    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const total = sortedTransactions.length;
    const paginatedTransactions = sortedTransactions.slice(skip, skip + parseInt(limit));

    // Format response
    const formattedTransactions = paginatedTransactions.map(transaction => ({
      amount: transaction.amount,
      type: transaction.type,
      reason: transaction.reason,
      relatedThought: transaction.relatedThought ? {
        id: transaction.relatedThought._id,
        title: transaction.relatedThought.title,
        status: transaction.relatedThought.status,
      } : null,
      timestamp: transaction.timestamp,
    }));

    res.status(200).json({
      success: true,
      data: {
        currentBalance: user.coins,
        transactions: formattedTransactions,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit)),
        },
      },
    });
  } catch (error) {
    console.error('Get coin transactions error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching coin transactions',
      error: error.message,
    });
  }
};

