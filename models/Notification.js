const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Please provide a notification title'],
      trim: true,
      validate: {
        validator: function(v) {
          return v && typeof v === 'string' && v.trim().length > 0;
        },
        message: 'Title must be a non-empty string'
      }
    },
    message: {
      type: String,
      required: [true, 'Please provide a notification message'],
      validate: {
        validator: function(v) {
          return v && typeof v === 'string' && v.trim().length > 0;
        },
        message: 'Message must be a non-empty string'
      }
    },
    type: {
      type: String,
      enum: ['course', 'system', 'assignment', 'general', 'announcement'],
      default: 'general',
    },
    targetAudience: {
      type: String,
      enum: ['all', 'students', 'instructors', 'premium', 'specific'],
      default: 'all',
    },
    targetUsers: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    }],
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'urgent'],
      default: 'medium',
    },
    status: {
      type: String,
      enum: ['draft', 'scheduled', 'sent', 'failed'],
      default: 'draft',
    },
    scheduledFor: {
      type: Date,
    },
    sentAt: {
      type: Date,
    },
    sentBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    readBy: [{
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
      readAt: {
        type: Date,
      },
    }],
    link: {
      type: String,
    },
    icon: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Notification', notificationSchema);

