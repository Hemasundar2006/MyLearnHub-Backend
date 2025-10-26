const mongoose = require('mongoose');

const contentSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Please provide a content title'],
      trim: true,
    },
    type: {
      type: String,
      enum: ['video', 'pdf', 'image', 'audio', 'document', 'other'],
      required: true,
    },
    url: {
      type: String,
      required: [true, 'Please provide a content URL'],
    },
    thumbnail: {
      type: String,
    },
    size: {
      type: Number, // in bytes
    },
    duration: {
      type: String, // for videos and audio
    },
    description: {
      type: String,
    },
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
    },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    status: {
      type: String,
      enum: ['draft', 'processing', 'published', 'archived'],
      default: 'published',
    },
    downloads: {
      type: Number,
      default: 0,
    },
    views: {
      type: Number,
      default: 0,
    },
    tags: [{
      type: String,
    }],
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Content', contentSchema);

