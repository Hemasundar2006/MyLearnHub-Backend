const mongoose = require('mongoose');

const doubtSchema = new mongoose.Schema(
  {
    question: {
      type: String,
      required: [true, 'Please provide a question'],
      trim: true,
      maxlength: [1000, 'Question cannot exceed 1000 characters'],
    },
    askedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'answered', 'closed'],
      default: 'pending',
    },
    adminResponse: {
      title: {
        type: String,
        trim: true,
        maxlength: [200, 'Title cannot exceed 200 characters'],
      },
      description: {
        type: String,
        trim: true,
        maxlength: [2000, 'Description cannot exceed 2000 characters'],
      },
      url: {
        type: String,
        trim: true,
      },
      answeredBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
      answeredAt: {
        type: Date,
      },
    },
  },
  {
    timestamps: true,
  }
);

// Index for better query performance
doubtSchema.index({ askedBy: 1, createdAt: -1 });
doubtSchema.index({ status: 1, createdAt: -1 });
doubtSchema.index({ 'adminResponse.answeredBy': 1 });

module.exports = mongoose.model('Doubt', doubtSchema);
