const mongoose = require('mongoose');

const resultSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      index: true,
    },
    quizId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Quiz',
      required: [true, 'Quiz ID is required'],
      index: true,
    },
    score: {
      type: Number,
      required: [true, 'Score is required'],
      min: [0, 'Score cannot be negative'],
    },
    percentage: {
      type: Number,
      required: [true, 'Percentage is required'],
      min: [0, 'Percentage cannot be negative'],
      max: [100, 'Percentage cannot exceed 100'],
    },
    correctAnswers: {
      type: Number,
      required: [true, 'Correct answers count is required'],
      min: [0, 'Correct answers cannot be negative'],
    },
    totalQuestions: {
      type: Number,
      required: [true, 'Total questions count is required'],
      min: [1, 'Total questions must be at least 1'],
    },
    durationSeconds: {
      type: Number,
      min: [0, 'Duration cannot be negative'],
    },
    userAnswers: [
      {
        questionIndex: Number,
        selectedAnswer: String,
        isCorrect: Boolean,
        points: Number,
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Compound index for faster queries
resultSchema.index({ userId: 1, quizId: 1 });
resultSchema.index({ userId: 1, createdAt: -1 });
resultSchema.index({ quizId: 1, percentage: -1 });

module.exports = mongoose.model('Result', resultSchema);

