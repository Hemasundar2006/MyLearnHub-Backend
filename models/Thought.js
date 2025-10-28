const mongoose = require('mongoose');

const thoughtSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Please provide a thought title'],
      trim: true,
      maxlength: [200, 'Title cannot be more than 200 characters'],
    },
    message: {
      type: String,
      required: [true, 'Please provide a thought message'],
      trim: true,
      maxlength: [1000, 'Message cannot be more than 1000 characters'],
    },
    
    submittedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    reviewedAt: {
      type: Date,
    },
    reviewNotes: {
      type: String,
      maxlength: [500, 'Review notes cannot be more than 500 characters'],
    },
    notificationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Notification',
    },
    
  },
  {
    timestamps: true,
  }
);

// Index for faster queries
thoughtSchema.index({ status: 1, createdAt: -1 });
thoughtSchema.index({ submittedBy: 1, createdAt: -1 });

module.exports = mongoose.model('Thought', thoughtSchema);

