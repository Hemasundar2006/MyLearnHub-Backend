const Notification = require('../models/Notification');
const User = require('../models/User');

// @desc    Get user's notifications
// @route   GET /api/notifications
// @access  Private
exports.getUserNotifications = async (req, res) => {
  try {
    const { status, type, page = 1, limit = 20 } = req.query;

    let query = {
      $or: [
        { targetAudience: 'all' },
        { targetAudience: 'students', 'targetUsers': req.user.id },
        { targetUsers: req.user.id }
      ],
      status: 'sent'
    };

    if (type) {
      query.type = type;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const notifications = await Notification.find(query)
      .sort({ sentAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .select('-targetUsers -readBy');

    // Check which notifications are read by this user
    const notificationsWithReadStatus = notifications.map(notif => {
      const isRead = notif.readBy.some(
        read => read.user.toString() === req.user.id
      );

      return {
        ...notif.toObject(),
        isRead,
        readBy: undefined // Remove readBy from response
      };
    });

    const totalNotifications = await Notification.countDocuments(query);

    res.status(200).json({
      success: true,
      count: notifications.length,
      total: totalNotifications,
      page: parseInt(page),
      pages: Math.ceil(totalNotifications / parseInt(limit)),
      notifications: notificationsWithReadStatus,
    });
  } catch (error) {
    console.error('Get user notifications error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching notifications',
      error: error.message,
    });
  }
};

// @desc    Get unread notifications count
// @route   GET /api/notifications/unread-count
// @access  Private
exports.getUnreadCount = async (req, res) => {
  try {
    const notifications = await Notification.find({
      $or: [
        { targetAudience: 'all' },
        { targetAudience: 'students', 'targetUsers': req.user.id },
        { targetUsers: req.user.id }
      ],
      status: 'sent',
      'readBy.user': { $ne: req.user.id }
    });

    res.status(200).json({
      success: true,
      unreadCount: notifications.length,
    });
  } catch (error) {
    console.error('Get unread count error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching unread count',
      error: error.message,
    });
  }
};

// @desc    Mark notification as read
// @route   POST /api/notifications/:id/read
// @access  Private
exports.markAsRead = async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id);

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found',
      });
    }

    // Check if already read by this user
    const alreadyRead = notification.readBy.some(
      read => read.user.toString() === req.user.id
    );

    if (!alreadyRead) {
      notification.readBy.push({
        user: req.user.id,
        readAt: new Date(),
      });
      await notification.save();
    }

    res.status(200).json({
      success: true,
      message: 'Notification marked as read',
    });
  } catch (error) {
    console.error('Mark as read error:', error);
    
    if (error.kind === 'ObjectId') {
      return res.status(404).json({
        success: false,
        message: 'Notification not found',
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error marking notification as read',
      error: error.message,
    });
  }
};

// @desc    Mark all notifications as read
// @route   POST /api/notifications/read-all
// @access  Private
exports.markAllAsRead = async (req, res) => {
  try {
    const notifications = await Notification.find({
      $or: [
        { targetAudience: 'all' },
        { targetAudience: 'students', 'targetUsers': req.user.id },
        { targetUsers: req.user.id }
      ],
      status: 'sent',
      'readBy.user': { $ne: req.user.id }
    });

    // Mark each notification as read
    const updatePromises = notifications.map(notification => {
      notification.readBy.push({
        user: req.user.id,
        readAt: new Date(),
      });
      return notification.save();
    });

    await Promise.all(updatePromises);

    res.status(200).json({
      success: true,
      message: `${notifications.length} notifications marked as read`,
      count: notifications.length,
    });
  } catch (error) {
    console.error('Mark all as read error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error marking notifications as read',
      error: error.message,
    });
  }
};

// @desc    Delete notification (for user)
// @route   DELETE /api/notifications/:id
// @access  Private
exports.deleteNotification = async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id);

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found',
      });
    }

    // For user-side, we just mark as read and don't actually delete
    // Or you can implement a "dismissed" field in the schema
    const alreadyRead = notification.readBy.some(
      read => read.user.toString() === req.user.id
    );

    if (!alreadyRead) {
      notification.readBy.push({
        user: req.user.id,
        readAt: new Date(),
      });
      await notification.save();
    }

    res.status(200).json({
      success: true,
      message: 'Notification dismissed',
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
      message: 'Server error dismissing notification',
      error: error.message,
    });
  }
};

