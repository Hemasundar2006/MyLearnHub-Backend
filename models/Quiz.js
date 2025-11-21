const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
  questionText: {
    type: String,
    required: [true, 'Question text is required'],
    trim: true,
  },
  options: {
    type: [String],
    required: [true, 'Options are required'],
    validate: {
      validator: function (options) {
        return options.length >= 2 && options.length <= 6;
      },
      message: 'A question must have between 2 and 6 options',
    },
  },
  correctAnswer: {
    type: String,
    required: [true, 'Correct answer is required'],
    trim: true,
  },
  points: {
    type: Number,
    default: 10,
    min: 1,
  },
}, { _id: true });

const quizSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Quiz title is required'],
      unique: true,
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },
    topic: {
      type: String,
      required: [true, 'Quiz topic is required'],
      trim: true,
      maxlength: [100, 'Topic cannot exceed 100 characters'],
    },
    difficulty: {
      type: String,
      required: [true, 'Difficulty level is required'],
      enum: {
        values: ['Easy', 'Medium', 'Hard'],
        message: 'Difficulty must be Easy, Medium, or Hard',
      },
    },
    questions: {
      type: [questionSchema],
      required: [true, 'Questions are required'],
      validate: {
        validator: function (questions) {
          return questions.length > 0;
        },
        message: 'Quiz must have at least one question',
      },
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

// Index for faster queries
quizSchema.index({ topic: 1, difficulty: 1 });
quizSchema.index({ isActive: 1 });

module.exports = mongoose.model('Quiz', quizSchema);

