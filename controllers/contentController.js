const Content = require('../models/Content');

// @desc    Get all content
// @route   GET /api/admin/content
// @access  Private/Admin
exports.getAllContent = async (req, res) => {
  try {
    const { type, status, course, page = 1, limit = 10 } = req.query;

    let query = {};

    if (type) {
      query.type = type;
    }

    if (status) {
      query.status = status;
    }

    if (course) {
      query.course = course;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const content = await Content.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate('uploadedBy', 'name email avatar')
      .populate('course', 'title');

    const totalContent = await Content.countDocuments(query);

    res.status(200).json({
      success: true,
      count: content.length,
      total: totalContent,
      page: parseInt(page),
      pages: Math.ceil(totalContent / parseInt(limit)),
      content,
    });
  } catch (error) {
    console.error('Get all content error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching content',
      error: error.message,
    });
  }
};

// @desc    Create content
// @route   POST /api/admin/content
// @access  Private/Admin
exports.createContent = async (req, res) => {
  try {
    const {
      title,
      type,
      url,
      thumbnail,
      size,
      duration,
      description,
      course,
      status,
      tags,
    } = req.body;

    if (!title || !type || !url) {
      return res.status(400).json({
        success: false,
        message: 'Please provide title, type, and URL',
      });
    }

    const content = await Content.create({
      title,
      type,
      url,
      thumbnail,
      size,
      duration,
      description,
      course,
      status: status || 'published',
      tags,
      uploadedBy: req.user.id,
    });

    const populatedContent = await Content.findById(content._id)
      .populate('uploadedBy', 'name email avatar')
      .populate('course', 'title');

    res.status(201).json({
      success: true,
      content: populatedContent,
      message: 'Content created successfully',
    });
  } catch (error) {
    console.error('Create content error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error creating content',
      error: error.message,
    });
  }
};

// @desc    Get content by ID
// @route   GET /api/admin/content/:id
// @access  Private/Admin
exports.getContentById = async (req, res) => {
  try {
    const content = await Content.findById(req.params.id)
      .populate('uploadedBy', 'name email avatar')
      .populate('course', 'title instructor');

    if (!content) {
      return res.status(404).json({
        success: false,
        message: 'Content not found',
      });
    }

    res.status(200).json({
      success: true,
      content,
    });
  } catch (error) {
    console.error('Get content by ID error:', error);
    
    if (error.kind === 'ObjectId') {
      return res.status(404).json({
        success: false,
        message: 'Content not found',
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error fetching content',
      error: error.message,
    });
  }
};

// @desc    Update content
// @route   PUT /api/admin/content/:id
// @access  Private/Admin
exports.updateContent = async (req, res) => {
  try {
    let content = await Content.findById(req.params.id);

    if (!content) {
      return res.status(404).json({
        success: false,
        message: 'Content not found',
      });
    }

    content = await Content.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true,
      }
    )
      .populate('uploadedBy', 'name email avatar')
      .populate('course', 'title');

    res.status(200).json({
      success: true,
      content,
      message: 'Content updated successfully',
    });
  } catch (error) {
    console.error('Update content error:', error);
    
    if (error.kind === 'ObjectId') {
      return res.status(404).json({
        success: false,
        message: 'Content not found',
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error updating content',
      error: error.message,
    });
  }
};

// @desc    Delete content
// @route   DELETE /api/admin/content/:id
// @access  Private/Admin
exports.deleteContent = async (req, res) => {
  try {
    const content = await Content.findById(req.params.id);

    if (!content) {
      return res.status(404).json({
        success: false,
        message: 'Content not found',
      });
    }

    await content.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Content deleted successfully',
      data: {},
    });
  } catch (error) {
    console.error('Delete content error:', error);
    
    if (error.kind === 'ObjectId') {
      return res.status(404).json({
        success: false,
        message: 'Content not found',
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error deleting content',
      error: error.message,
    });
  }
};

// @desc    Get content statistics
// @route   GET /api/admin/content/stats
// @access  Private/Admin
exports.getContentStats = async (req, res) => {
  try {
    const totalContent = await Content.countDocuments();

    // Content by type
    const contentByType = await Content.aggregate([
      {
        $group: {
          _id: '$type',
          count: { $sum: 1 },
          totalSize: { $sum: '$size' },
        },
      },
    ]);

    // Content by status
    const contentByStatus = await Content.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
        },
      },
    ]);

    // Total storage used (in bytes)
    const storageData = await Content.aggregate([
      {
        $group: {
          _id: null,
          totalSize: { $sum: '$size' },
        },
      },
    ]);

    const totalStorage = storageData[0]?.totalSize || 0;

    // Total views and downloads
    const engagementData = await Content.aggregate([
      {
        $group: {
          _id: null,
          totalViews: { $sum: '$views' },
          totalDownloads: { $sum: '$downloads' },
        },
      },
    ]);

    res.status(200).json({
      success: true,
      stats: {
        total: totalContent,
        byType: contentByType,
        byStatus: contentByStatus,
        totalStorage,
        totalViews: engagementData[0]?.totalViews || 0,
        totalDownloads: engagementData[0]?.totalDownloads || 0,
      },
    });
  } catch (error) {
    console.error('Get content stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching content statistics',
      error: error.message,
    });
  }
};

// @desc    Increment content views
// @route   POST /api/admin/content/:id/view
// @access  Private/Admin
exports.incrementViews = async (req, res) => {
  try {
    const content = await Content.findByIdAndUpdate(
      req.params.id,
      { $inc: { views: 1 } },
      { new: true }
    );

    if (!content) {
      return res.status(404).json({
        success: false,
        message: 'Content not found',
      });
    }

    res.status(200).json({
      success: true,
      views: content.views,
    });
  } catch (error) {
    console.error('Increment views error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error updating views',
      error: error.message,
    });
  }
};

// @desc    Increment content downloads
// @route   POST /api/admin/content/:id/download
// @access  Private/Admin
exports.incrementDownloads = async (req, res) => {
  try {
    const content = await Content.findByIdAndUpdate(
      req.params.id,
      { $inc: { downloads: 1 } },
      { new: true }
    );

    if (!content) {
      return res.status(404).json({
        success: false,
        message: 'Content not found',
      });
    }

    res.status(200).json({
      success: true,
      downloads: content.downloads,
    });
  } catch (error) {
    console.error('Increment downloads error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error updating downloads',
      error: error.message,
    });
  }
};

