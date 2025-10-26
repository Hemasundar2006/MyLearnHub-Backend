const Notification = require('../models/Notification');
const User = require('../models/User');

// @desc    Get all notifications
// @route   GET /api/admin/notifications
// @access  Private/Admin
exports.getAllNotifications = async (req, res) => {
  try {
    const { status, type, page = 1, limit = 10 } = req.query;

    let query = {};

    if (status) {
      query.status = status;
    }

    if (type) {
      query.type = type;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate('sentBy', 'name email avatar');

    const totalNotifications = await Notification.countDocuments(query);

    res.status(200).json({
      success: true,
      count: notifications.length,
      total: totalNotifications,
      page: parseInt(page),
      pages: Math.ceil(totalNotifications / parseInt(limit)),
      notifications,
    });
  } catch (error) {
    console.error('Get all notifications error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching notifications',
      error: error.message,
    });
  }
};

// @desc    Create notification
// @route   POST /api/admin/notifications
// @access  Private/Admin
exports.createNotification = async (req, res) => {
  try {
    const {
      title,
      message,
      type,
      targetAudience,
      targetUsers,
      priority,
      scheduledFor,
      link,
      icon,
    } = req.body;

    if (!title || !message) {
      return res.status(400).json({
        success: false,
        message: 'Please provide title and message',
      });
    }

    // Get target users based on audience
    let recipients = [];
    if (targetAudience === 'all') {
      recipients = await User.find().select('_id');
    } else if (targetAudience === 'students') {
      recipients = await User.find({ role: 'user' }).select('_id');
    } else if (targetAudience === 'instructors') {
      recipients = await User.find({ role: 'instructor' }).select('_id');
    } else if (targetAudience === 'specific' && targetUsers) {
      recipients = targetUsers.map(id => ({ _id: id }));
    }

    const notification = await Notification.create({
      title,
      message,
      type: type || 'general',
      targetAudience: targetAudience || 'all',
      targetUsers: recipients.map(u => u._id),
      priority: priority || 'medium',
      status: scheduledFor ? 'scheduled' : 'sent',
      scheduledFor,
      sentAt: scheduledFor ? null : new Date(),
      sentBy: req.user.id,
      link,
      icon,
    });

    const populatedNotification = await Notification.findById(notification._id)
      .populate('sentBy', 'name email avatar');

    res.status(201).json({
      success: true,
      notification: populatedNotification,
      message: scheduledFor ? 'Notification scheduled successfully' : 'Notification sent successfully',
    });
  } catch (error) {
    console.error('Create notification error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error creating notification',
      error: error.message,
    });
  }
};

// @desc    Get notification by ID
// @route   GET /api/admin/notifications/:id
// @access  Private/Admin
exports.getNotificationById = async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id)
      .populate('sentBy', 'name email avatar')
      .populate('targetUsers', 'name email avatar')
      .populate('readBy.user', 'name email avatar');

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found',
      });
    }

    res.status(200).json({
      success: true,
      notification,
    });
  } catch (error) {
    console.error('Get notification by ID error:', error);
    
    if (error.kind === 'ObjectId') {
      return res.status(404).json({
        success: false,
        message: 'Notification not found',
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error fetching notification',
      error: error.message,
    });
  }
};

// @desc    Update notification
// @route   PUT /api/admin/notifications/:id
// @access  Private/Admin
exports.updateNotification = async (req, res) => {
  try {
    let notification = await Notification.findById(req.params.id);

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found',
      });
    }

    // Only allow updating draft or scheduled notifications
    if (notification.status === 'sent') {
      return res.status(400).json({
        success: false,
        message: 'Cannot update sent notifications',
      });
    }

    notification = await Notification.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true,
      }
    ).populate('sentBy', 'name email avatar');

    res.status(200).json({
      success: true,
      notification,
      message: 'Notification updated successfully',
    });
  } catch (error) {
    console.error('Update notification error:', error);
    
    if (error.kind === 'ObjectId') {
      return res.status(404).json({
        success: false,
        message: 'Notification not found',
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error updating notification',
      error: error.message,
    });
  }
};

// @desc    Delete notification
// @route   DELETE /api/admin/notifications/:id
// @access  Private/Admin
exports.deleteNotification = async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id);

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found',
      });
    }

    await notification.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Notification deleted successfully',
      data: {},
    });
  } catch (error) {
    console.error('Delete notification error:', error);
    
    if (error.kind === 'ObjectId') {
      return res.status(404).json({
        success: false,
        message: 'Notification not found',
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error deleting notification',
      error: error.message,
    });
  }
};

// @desc    Get notification stats
// @route   GET /api/admin/notifications/stats
// @access  Private/Admin
exports.getNotificationStats = async (req, res) => {
  try {
    const totalNotifications = await Notification.countDocuments();
    const sentNotifications = await Notification.countDocuments({ status: 'sent' });
    const scheduledNotifications = await Notification.countDocuments({ status: 'scheduled' });
    const draftNotifications = await Notification.countDocuments({ status: 'draft' });

    // Notifications by type
    const notificationsByType = await Notification.aggregate([
      {
        $group: {
          _id: '$type',
          count: { $sum: 1 },
        },
      },
    ]);

    // Average read rate
    const notificationsWithReads = await Notification.find({ status: 'sent' });
    const totalSent = notificationsWithReads.length;
    const totalReads = notificationsWithReads.reduce((sum, n) => sum + n.readBy.length, 0);
    const averageReadRate = totalSent > 0
      ? ((totalReads / totalSent) * 100).toFixed(2)
      : 0;

    res.status(200).json({
      success: true,
      stats: {
        total: totalNotifications,
        sent: sentNotifications,
        scheduled: scheduledNotifications,
        draft: draftNotifications,
        byType: notificationsByType,
        averageReadRate: parseFloat(averageReadRate),
      },
    });
  } catch (error) {
    console.error('Get notification stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching notification statistics',
      error: error.message,
    });
  }
};

