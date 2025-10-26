const Notification = require('../models/Notification');
const User = require('../models/User');

// @desc    Get user's notifications
// @route   GET /api/notifications
// @access  Private
exports.getUserNotifications = async (req, res) => {
  try {
    const { status, type, page = 1, limit = 20 } = req.query;

    console.log('User ID:', req.user.id);
    console.log('User role:', req.user.role);

    let query = {
      $or: [
        { targetAudience: 'all' },
        { targetAudience: 'students', targetUsers: req.user.id },
        { targetAudience: 'instructors', targetUsers: req.user.id },
        { targetAudience: 'specific', targetUsers: req.user.id },
        { targetUsers: req.user.id }
      ],
      status: 'sent'
    };

    console.log('Query:', JSON.stringify(query, null, 2));

    if (type) {
      query.type = type;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const notifications = await Notification.find(query)
      .sort({ sentAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    console.log('Found notifications:', notifications.length);
    console.log('Notifications:', notifications.map(n => ({ id: n._id, title: n.title, targetAudience: n.targetAudience, targetUsers: n.targetUsers })));

    // Check which notifications are read by this user and format response
    const formattedNotifications = notifications.map(notif => {
      const isRead = notif.readBy.some(
        read => read.user.toString() === req.user.id
      );

      return {
        id: notif._id.toString(),
        title: notif.title,
        message: notif.message,
        type: notif.type,
        read: isRead,
        priority: notif.priority,
        link: notif.link,
        icon: notif.icon,
        createdAt: notif.sentAt || notif.createdAt
      };
    });

    res.status(200).json({
      success: true,
      data: {
        notifications: formattedNotifications
      }
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
        { targetAudience: 'students', targetUsers: req.user.id },
        { targetAudience: 'instructors', targetUsers: req.user.id },
        { targetAudience: 'specific', targetUsers: req.user.id },
        { targetUsers: req.user.id }
      ],
      status: 'sent',
      'readBy.user': { $ne: req.user.id }
    });

    res.status(200).json({
      success: true,
      data: {
        unreadCount: notifications.length
      }
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
    const mongoose = require('mongoose');
    
    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid notification ID format',
      });
    }

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
    
    if (error.kind === 'ObjectId' || error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid notification ID format',
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
        { targetAudience: 'students', targetUsers: req.user.id },
        { targetAudience: 'instructors', targetUsers: req.user.id },
        { targetAudience: 'specific', targetUsers: req.user.id },
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
    const mongoose = require('mongoose');
    
    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid notification ID format',
      });
    }

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
    
    if (error.kind === 'ObjectId' || error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid notification ID format',
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error dismissing notification',
      error: error.message,
    });
  }
};

