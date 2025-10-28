const Thought = require('../models/Thought');
const Notification = require('../models/Notification');
const User = require('../models/User');

// @desc    Get all thoughts (for admin)
// @route   GET /api/admin/thoughts
// @access  Private (Admin)
exports.getAllThoughts = async (req, res) => {
  try {
    const { status, search, sortBy = 'newest', page = 1, limit = 20 } = req.query;

    let query = {};

    // Filter by status
    if (status && ['pending', 'approved', 'rejected'].includes(status)) {
      query.status = status;
    }

    // No category filter anymore

    // Search functionality
    if (search && search.trim() !== '') {
      const searchRegex = new RegExp(search.trim(), 'i');
      query.$or = [
        { title: searchRegex },
        { message: searchRegex },
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Fetch thoughts
    let thoughts = await Thought.find(query)
      .populate('submittedBy', 'name email role')
      .populate('reviewedBy', 'name email')
      .populate('notificationId', 'title type sentAt status');

    // Sort
    switch (sortBy.toLowerCase()) {
      case 'newest':
        thoughts.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        break;
      case 'oldest':
        thoughts.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
        break;
      // priority sorting removed
      default:
        thoughts.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }

    // Pagination
    const total = thoughts.length;
    const paginatedThoughts = thoughts.slice(skip, skip + parseInt(limit));

    // Format response
    const formattedThoughts = paginatedThoughts.map(thought => ({
      id: thought._id,
      title: thought.title,
      message: thought.message,
      status: thought.status,
      submittedBy: {
        id: thought.submittedBy._id,
        name: thought.submittedBy.name,
        email: thought.submittedBy.email,
        role: thought.submittedBy.role,
      },
      reviewedBy: thought.reviewedBy ? {
        id: thought.reviewedBy._id,
        name: thought.reviewedBy.name,
        email: thought.reviewedBy.email,
      } : null,
      reviewedAt: thought.reviewedAt,
      reviewNotes: thought.reviewNotes,
      notificationId: thought.notificationId?._id,
      notificationStatus: thought.notificationId?.status,
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
    console.error('Get all thoughts error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching thoughts',
      error: error.message,
    });
  }
};

// @desc    Get thought statistics (for admin)
// @route   GET /api/admin/thoughts/stats
// @access  Private (Admin)
exports.getThoughtStats = async (req, res) => {
  try {
    // Get counts by status
    const [pending, approved, rejected, total] = await Promise.all([
      Thought.countDocuments({ status: 'pending' }),
      Thought.countDocuments({ status: 'approved' }),
      Thought.countDocuments({ status: 'rejected' }),
      Thought.countDocuments({}),
    ]);

    // Category stats removed

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
    console.error('Get thought stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching thought statistics',
      error: error.message,
    });
  }
};

// @desc    Get single thought details
// @route   GET /api/admin/thoughts/:id
// @access  Private (Admin)
exports.getThoughtById = async (req, res) => {
  try {
    const mongoose = require('mongoose');
    
    console.log('Get thought by ID - ID received:', req.params.id);
    console.log('Get thought by ID - ID type:', typeof req.params.id);
    console.log('Get thought by ID - Raw params:', req.params);
    
    // Check if ID exists
    if (!req.params.id) {
      console.log('No ID provided in request');
      return res.status(400).json({
        success: false,
        message: 'Thought ID is required',
      });
    }
    
    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      console.log('Invalid ID format:', req.params.id);
      return res.status(400).json({
        success: false,
        message: 'Invalid thought ID format',
        receivedId: req.params.id,
      });
    }

    const thought = await Thought.findById(req.params.id)
      .populate('submittedBy', 'name email role createdAt')
      .populate('reviewedBy', 'name email')
      .populate('notificationId');

    if (!thought) {
      return res.status(404).json({
        success: false,
        message: 'Thought not found',
      });
    }

    res.status(200).json({
      success: true,
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
            role: thought.submittedBy.role,
            memberSince: thought.submittedBy.createdAt,
          },
          reviewedBy: thought.reviewedBy ? {
            id: thought.reviewedBy._id,
            name: thought.reviewedBy.name,
            email: thought.reviewedBy.email,
          } : null,
          reviewedAt: thought.reviewedAt,
          reviewNotes: thought.reviewNotes,
          notification: thought.notificationId ? {
            id: thought.notificationId._id,
            title: thought.notificationId.title,
            type: thought.notificationId.type,
            status: thought.notificationId.status,
            sentAt: thought.notificationId.sentAt,
          } : null,
          createdAt: thought.createdAt,
          updatedAt: thought.updatedAt,
        },
      },
    });
  } catch (error) {
    console.error('Get thought by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching thought',
      error: error.message,
    });
  }
};

// @desc    Approve thought and create notification
// @route   POST /api/admin/thoughts/:id/approve
// @access  Private (Admin)
exports.approveThought = async (req, res) => {
  try {
    const mongoose = require('mongoose');
    const { reviewNotes, targetAudience = 'all', priority } = req.body;
    
    console.log('Approve thought - ID received:', req.params.id);
    console.log('Approve thought - ID type:', typeof req.params.id);
    console.log('Approve thought - Raw params:', req.params);
    
    // Check if ID exists
    if (!req.params.id) {
      console.log('No ID provided in request');
      return res.status(400).json({
        success: false,
        message: 'Thought ID is required',
      });
    }
    
    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      console.log('Invalid ID format:', req.params.id);
      return res.status(400).json({
        success: false,
        message: 'Invalid thought ID format',
        receivedId: req.params.id,
      });
    }

    const thought = await Thought.findById(req.params.id)
      .populate('submittedBy', 'name email');

    if (!thought) {
      return res.status(404).json({
        success: false,
        message: 'Thought not found',
      });
    }

    // Check if already reviewed
    if (thought.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: `Thought is already ${thought.status}`,
      });
    }

    // Create notification from the thought
    const notification = await Notification.create({
      title: thought.title,
      message: thought.message,
      type: 'general',
      targetAudience: targetAudience,
      priority: priority || 'medium',
      status: 'sent',
      sentAt: new Date(),
      sentBy: req.user.id,
      icon: '💡',
    });

    // Update thought status
    thought.status = 'approved';
    thought.reviewedBy = req.user.id;
    thought.reviewedAt = new Date();
    thought.reviewNotes = reviewNotes || 'Approved and published as notification';
    thought.notificationId = notification._id;
    await thought.save();

    // Award 10 coins to the user who submitted the thought
    const COIN_REWARD = 10;
    const submitter = await User.findById(thought.submittedBy._id);
    
    if (submitter) {
      submitter.coins += COIN_REWARD;
      submitter.coinTransactions.push({
        amount: COIN_REWARD,
        type: 'earned',
        reason: `Thought approved: "${thought.title}"`,
        relatedThought: thought._id,
        timestamp: new Date(),
      });
      await submitter.save();
    }

    res.status(200).json({
      success: true,
      message: 'Thought approved and notification created successfully',
      data: {
        thought: {
          id: thought._id,
          status: thought.status,
          reviewedAt: thought.reviewedAt,
        },
        notification: {
          id: notification._id,
          title: notification.title,
          type: notification.type,
          targetAudience: notification.targetAudience,
          sentAt: notification.sentAt,
        },
        coinsAwarded: {
          amount: COIN_REWARD,
          newBalance: submitter ? submitter.coins : 0,
        },
      },
    });
  } catch (error) {
    console.error('Approve thought error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error approving thought',
      error: error.message,
    });
  }
};

// @desc    Reject thought
// @route   POST /api/admin/thoughts/:id/reject
// @access  Private (Admin)
exports.rejectThought = async (req, res) => {
  try {
    const mongoose = require('mongoose');
    const { reviewNotes } = req.body;
    
    console.log('Reject thought - ID received:', req.params.id);
    console.log('Reject thought - ID type:', typeof req.params.id);
    console.log('Reject thought - Raw params:', req.params);
    
    // Check if ID exists
    if (!req.params.id) {
      console.log('No ID provided in request');
      return res.status(400).json({
        success: false,
        message: 'Thought ID is required',
      });
    }
    
    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      console.log('Invalid ID format:', req.params.id);
      return res.status(400).json({
        success: false,
        message: 'Invalid thought ID format',
        receivedId: req.params.id,
      });
    }

    const thought = await Thought.findById(req.params.id);

    if (!thought) {
      return res.status(404).json({
        success: false,
        message: 'Thought not found',
      });
    }

    // Check if already reviewed
    if (thought.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: `Thought is already ${thought.status}`,
      });
    }

    // Require review notes for rejection
    if (!reviewNotes || reviewNotes.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Please provide review notes explaining the rejection',
      });
    }

    // Update thought status
    thought.status = 'rejected';
    thought.reviewedBy = req.user.id;
    thought.reviewedAt = new Date();
    thought.reviewNotes = reviewNotes.trim();
    await thought.save();

    res.status(200).json({
      success: true,
      message: 'Thought rejected',
      data: {
        thought: {
          id: thought._id,
          status: thought.status,
          reviewedAt: thought.reviewedAt,
          reviewNotes: thought.reviewNotes,
        },
      },
    });
  } catch (error) {
    console.error('Reject thought error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error rejecting thought',
      error: error.message,
    });
  }
};

// @desc    Delete thought (for admin)
// @route   DELETE /api/admin/thoughts/:id
// @access  Private (Admin)
exports.deleteThought = async (req, res) => {
  try {
    const mongoose = require('mongoose');
    
    console.log('Delete thought - ID received:', req.params.id);
    console.log('Delete thought - ID type:', typeof req.params.id);
    console.log('Delete thought - Raw params:', req.params);
    
    // Check if ID exists
    if (!req.params.id) {
      console.log('No ID provided in request');
      return res.status(400).json({
        success: false,
        message: 'Thought ID is required',
      });
    }
    
    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      console.log('Invalid ID format:', req.params.id);
      return res.status(400).json({
        success: false,
        message: 'Invalid thought ID format',
        receivedId: req.params.id,
      });
    }

    const thought = await Thought.findById(req.params.id);

    if (!thought) {
      return res.status(404).json({
        success: false,
        message: 'Thought not found',
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

// Helper function to get icon for category
function getIconForCategory(category) {
  const icons = {
    announcement: '📢',
    course: '📚',
    system: '⚙️',
    assignment: '📝',
    general: '💡',
  };
  return icons[category] || '📌';
}

