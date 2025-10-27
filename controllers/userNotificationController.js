const Notification = require('../models/Notification');
const User = require('../models/User');

// @desc    Get user's notifications with advanced filtering
// @route   GET /api/notifications
// @access  Private
exports.getUserNotifications = async (req, res) => {
  try {
    const { 
      status, 
      type, 
      category,
      search, 
      sortBy = 'newest', 
      page = 1, 
      limit = 20 
    } = req.query;

    console.log('User ID:', req.user.id);
    console.log('User role:', req.user.role);
    console.log('Filters:', { type, category, search, sortBy });

    // Base query for user's notifications
    let query = {
      $or: [
        { targetAudience: 'all' },
        { targetAudience: 'students', targetUsers: req.user.id },
        { targetAudience: 'instructors', targetUsers: req.user.id },
        { targetAudience: 'specific', targetUsers: req.user.id },
        { targetUsers: req.user.id }
      ],
      status: 'sent',
      dismissedBy: { $ne: req.user.id }
    };

    // Category/Type filtering
    // Frontend categories: All, Announcements, Courses, System, Assignments
    if (category && category !== 'all') {
      const categoryTypeMap = {
        'announcements': 'announcement',
        'courses': 'course',
        'system': 'system',
        'assignments': 'assignment'
      };
      query.type = categoryTypeMap[category.toLowerCase()] || category;
    } else if (type && type !== 'all') {
      query.type = type;
    }

    // Search functionality - search in title, message, and type
    if (search && search.trim() !== '') {
      const searchRegex = new RegExp(search.trim(), 'i');
      query.$and = query.$and || [];
      query.$and.push({
        $or: [
          { title: searchRegex },
          { message: searchRegex },
          { type: searchRegex }
        ]
      });
    }

    console.log('Query:', JSON.stringify(query, null, 2));

    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Fetch all notifications to handle sorting by read status
    let notifications = await Notification.find(query);

    console.log('Found notifications before sorting:', notifications.length);

    // Format notifications with read status
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
        createdAt: notif.sentAt || notif.createdAt,
        sentAt: notif.sentAt || notif.createdAt
      };
    });

    // Smart sorting
    let sortedNotifications = [...formattedNotifications];
    switch (sortBy.toLowerCase()) {
      case 'newest':
        sortedNotifications.sort((a, b) => new Date(b.sentAt) - new Date(a.sentAt));
        break;
      case 'oldest':
        sortedNotifications.sort((a, b) => new Date(a.sentAt) - new Date(b.sentAt));
        break;
      case 'unread':
      case 'unread_first':
        // Unread first, then by newest
        sortedNotifications.sort((a, b) => {
          if (a.read === b.read) {
            return new Date(b.sentAt) - new Date(a.sentAt);
          }
          return a.read ? 1 : -1;
        });
        break;
      default:
        sortedNotifications.sort((a, b) => new Date(b.sentAt) - new Date(a.sentAt));
    }

    // Pagination
    const total = sortedNotifications.length;
    const paginatedNotifications = sortedNotifications.slice(skip, skip + parseInt(limit));

    res.status(200).json({
      success: true,
      data: {
        notifications: paginatedNotifications,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: total,
          pages: Math.ceil(total / parseInt(limit))
        }
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
      'readBy.user': { $ne: req.user.id },
      dismissedBy: { $ne: req.user.id }
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

// @desc    Get category counts with unread badges
// @route   GET /api/notifications/category-counts
// @access  Private
exports.getCategoryCounts = async (req, res) => {
  try {
    // Base query for user's notifications
    const baseQuery = {
      $or: [
        { targetAudience: 'all' },
        { targetAudience: 'students', targetUsers: req.user.id },
        { targetAudience: 'instructors', targetUsers: req.user.id },
        { targetAudience: 'specific', targetUsers: req.user.id },
        { targetUsers: req.user.id }
      ],
      status: 'sent',
      dismissedBy: { $ne: req.user.id }
    };

    // Get all notifications for the user
    const allNotifications = await Notification.find(baseQuery);

    // Initialize counts
    const counts = {
      all: { total: 0, unread: 0 },
      announcements: { total: 0, unread: 0 },
      courses: { total: 0, unread: 0 },
      system: { total: 0, unread: 0 },
      assignments: { total: 0, unread: 0 }
    };

    // Count notifications by category
    allNotifications.forEach(notification => {
      const isRead = notification.readBy.some(
        read => read.user.toString() === req.user.id
      );

      // Increment all count
      counts.all.total++;
      if (!isRead) counts.all.unread++;

      // Increment specific category count
      const type = notification.type;
      if (type === 'announcement') {
        counts.announcements.total++;
        if (!isRead) counts.announcements.unread++;
      } else if (type === 'course') {
        counts.courses.total++;
        if (!isRead) counts.courses.unread++;
      } else if (type === 'system') {
        counts.system.total++;
        if (!isRead) counts.system.unread++;
      } else if (type === 'assignment') {
        counts.assignments.total++;
        if (!isRead) counts.assignments.unread++;
      }
    });

    res.status(200).json({
      success: true,
      data: {
        counts
      }
    });
  } catch (error) {
    console.error('Get category counts error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching category counts',
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
      'readBy.user': { $ne: req.user.id },
      dismissedBy: { $ne: req.user.id }
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

    // Check if already dismissed by this user
    const alreadyDismissed = notification.dismissedBy.some(
      userId => userId.toString() === req.user.id
    );

    if (!alreadyDismissed) {
      // Add user to dismissedBy array
      notification.dismissedBy.push(req.user.id);
      await notification.save();
    }

    res.status(200).json({
      success: true,
      message: 'Notification dismissed successfully',
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

// @desc    Dismiss notification (hide from user's view)
// @route   POST /api/notifications/:id/dismiss
// @access  Private
exports.dismissNotification = async (req, res) => {
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

    // Check if already dismissed by this user
    const alreadyDismissed = notification.dismissedBy.some(
      userId => userId.toString() === req.user.id
    );

    if (!alreadyDismissed) {
      // Add user to dismissedBy array
      notification.dismissedBy.push(req.user.id);
      await notification.save();
    }

    res.status(200).json({
      success: true,
      message: 'Notification dismissed successfully',
    });
  } catch (error) {
    console.error('Dismiss notification error:', error);
    
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

