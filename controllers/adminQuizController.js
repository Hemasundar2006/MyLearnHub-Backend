const Quiz = require('../models/Quiz');
const Result = require('../models/Result');
const User = require('../models/User');

// @desc    Get all quizzes (admin view - includes inactive)
// @route   GET /api/admin/quizzes
// @access  Private/Admin
exports.getAllQuizzes = async (req, res) => {
  try {
    const { topic, difficulty, isActive, page = 1, limit = 10 } = req.query;

    // Build query
    let query = {};

    if (topic) {
      query.topic = { $regex: topic, $options: 'i' };
    }

    if (difficulty) {
      query.difficulty = difficulty;
    }

    if (isActive !== undefined) {
      query.isActive = isActive === 'true';
    }

    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const quizzes = await Quiz.find(query)
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const totalQuizzes = await Quiz.countDocuments(query);

    res.status(200).json({
      success: true,
      count: quizzes.length,
      total: totalQuizzes,
      page: parseInt(page),
      pages: Math.ceil(totalQuizzes / parseInt(limit)),
      quizzes,
    });
  } catch (error) {
    console.error('Get all quizzes (admin) error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching quizzes',
      error: error.message,
    });
  }
};

// @desc    Get quiz by ID (admin view - includes correct answers)
// @route   GET /api/admin/quizzes/:id
// @access  Private/Admin
exports.getQuizById = async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.id)
      .populate('createdBy', 'name email avatar');

    if (!quiz) {
      return res.status(404).json({
        success: false,
        message: 'Quiz not found',
      });
    }

    res.status(200).json({
      success: true,
      quiz,
    });
  } catch (error) {
    console.error('Get quiz by ID (admin) error:', error);
    
    if (error.kind === 'ObjectId') {
      return res.status(404).json({
        success: false,
        message: 'Quiz not found',
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error fetching quiz',
      error: error.message,
    });
  }
};

// @desc    Create new quiz
// @route   POST /api/admin/quizzes
// @access  Private/Admin
exports.createQuiz = async (req, res) => {
  try {
    const { title, topic, difficulty, questions, isActive } = req.body;

    // Validation
    if (!title || !topic || !difficulty) {
      return res.status(400).json({
        success: false,
        message: 'Please provide title, topic, and difficulty',
      });
    }

    if (!questions || !Array.isArray(questions) || questions.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please provide at least one question',
      });
    }

    // Validate difficulty
    if (!['Easy', 'Medium', 'Hard'].includes(difficulty)) {
      return res.status(400).json({
        success: false,
        message: 'Difficulty must be Easy, Medium, or Hard',
      });
    }

    // Validate questions
    for (let i = 0; i < questions.length; i++) {
      const question = questions[i];
      
      if (!question.questionText || !question.questionText.trim()) {
        return res.status(400).json({
          success: false,
          message: `Question ${i + 1}: questionText is required`,
        });
      }

      if (!question.options || !Array.isArray(question.options) || question.options.length < 2) {
        return res.status(400).json({
          success: false,
          message: `Question ${i + 1}: options must be an array with at least 2 items`,
        });
      }

      if (question.options.length > 6) {
        return res.status(400).json({
          success: false,
          message: `Question ${i + 1}: options cannot exceed 6 items`,
        });
      }

      if (!question.correctAnswer || !question.correctAnswer.trim()) {
        return res.status(400).json({
          success: false,
          message: `Question ${i + 1}: correctAnswer is required`,
        });
      }

      // Validate that correctAnswer exists in options
      if (!question.options.includes(question.correctAnswer)) {
        return res.status(400).json({
          success: false,
          message: `Question ${i + 1}: correctAnswer must be one of the provided options`,
        });
      }

      // Validate points
      if (question.points !== undefined && (question.points < 1 || !Number.isInteger(question.points))) {
        return res.status(400).json({
          success: false,
          message: `Question ${i + 1}: points must be a positive integer`,
        });
      }
    }

    // Create quiz
    const quiz = await Quiz.create({
      title: title.trim(),
      topic: topic.trim(),
      difficulty,
      questions: questions.map(q => ({
        questionText: q.questionText.trim(),
        options: q.options.map(opt => opt.trim()),
        correctAnswer: q.correctAnswer.trim(),
        points: q.points || 10,
      })),
      isActive: isActive !== undefined ? isActive : true,
      createdBy: req.user.id,
    });

    res.status(201).json({
      success: true,
      quiz,
      message: 'Quiz created successfully',
    });
  } catch (error) {
    console.error('Create quiz error:', error);
    
    // Handle duplicate title error
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Quiz title already exists',
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error creating quiz',
      error: error.message,
    });
  }
};

// @desc    Update quiz
// @route   PUT /api/admin/quizzes/:id
// @access  Private/Admin
exports.updateQuiz = async (req, res) => {
  try {
    const { title, topic, difficulty, questions, isActive } = req.body;

    let quiz = await Quiz.findById(req.params.id);

    if (!quiz) {
      return res.status(404).json({
        success: false,
        message: 'Quiz not found',
      });
    }

    // Update fields if provided
    if (title !== undefined) {
      quiz.title = title.trim();
    }

    if (topic !== undefined) {
      quiz.topic = topic.trim();
    }

    if (difficulty !== undefined) {
      if (!['Easy', 'Medium', 'Hard'].includes(difficulty)) {
        return res.status(400).json({
          success: false,
          message: 'Difficulty must be Easy, Medium, or Hard',
        });
      }
      quiz.difficulty = difficulty;
    }

    if (isActive !== undefined) {
      quiz.isActive = isActive;
    }

    // Update questions if provided
    if (questions !== undefined) {
      if (!Array.isArray(questions) || questions.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Questions must be a non-empty array',
        });
      }

      // Validate questions
      for (let i = 0; i < questions.length; i++) {
        const question = questions[i];
        
        if (!question.questionText || !question.questionText.trim()) {
          return res.status(400).json({
            success: false,
            message: `Question ${i + 1}: questionText is required`,
          });
        }

        if (!question.options || !Array.isArray(question.options) || question.options.length < 2) {
          return res.status(400).json({
            success: false,
            message: `Question ${i + 1}: options must be an array with at least 2 items`,
          });
        }

        if (question.options.length > 6) {
          return res.status(400).json({
            success: false,
            message: `Question ${i + 1}: options cannot exceed 6 items`,
          });
        }

        if (!question.correctAnswer || !question.correctAnswer.trim()) {
          return res.status(400).json({
            success: false,
            message: `Question ${i + 1}: correctAnswer is required`,
          });
        }

        if (!question.options.includes(question.correctAnswer)) {
          return res.status(400).json({
            success: false,
            message: `Question ${i + 1}: correctAnswer must be one of the provided options`,
          });
        }

        if (question.points !== undefined && (question.points < 1 || !Number.isInteger(question.points))) {
          return res.status(400).json({
            success: false,
            message: `Question ${i + 1}: points must be a positive integer`,
          });
        }
      }

      quiz.questions = questions.map(q => ({
        questionText: q.questionText.trim(),
        options: q.options.map(opt => opt.trim()),
        correctAnswer: q.correctAnswer.trim(),
        points: q.points || 10,
      }));
    }

    await quiz.save();

    res.status(200).json({
      success: true,
      quiz,
      message: 'Quiz updated successfully',
    });
  } catch (error) {
    console.error('Update quiz error:', error);
    
    if (error.kind === 'ObjectId') {
      return res.status(404).json({
        success: false,
        message: 'Quiz not found',
      });
    }

    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Quiz title already exists',
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error updating quiz',
      error: error.message,
    });
  }
};

// @desc    Delete quiz
// @route   DELETE /api/admin/quizzes/:id
// @access  Private/Admin
exports.deleteQuiz = async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.id);

    if (!quiz) {
      return res.status(404).json({
        success: false,
        message: 'Quiz not found',
      });
    }

    await quiz.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Quiz deleted successfully',
      data: {},
    });
  } catch (error) {
    console.error('Delete quiz error:', error);
    
    if (error.kind === 'ObjectId') {
      return res.status(404).json({
        success: false,
        message: 'Quiz not found',
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error deleting quiz',
      error: error.message,
    });
  }
};

// @desc    Toggle quiz active status
// @route   PATCH /api/admin/quizzes/:id/toggle-status
// @access  Private/Admin
exports.toggleQuizStatus = async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.id);

    if (!quiz) {
      return res.status(404).json({
        success: false,
        message: 'Quiz not found',
      });
    }

    quiz.isActive = !quiz.isActive;
    await quiz.save();

    res.status(200).json({
      success: true,
      quiz,
      message: `Quiz ${quiz.isActive ? 'activated' : 'deactivated'} successfully`,
    });
  } catch (error) {
    console.error('Toggle quiz status error:', error);
    
    if (error.kind === 'ObjectId') {
      return res.status(404).json({
        success: false,
        message: 'Quiz not found',
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error toggling quiz status',
      error: error.message,
    });
  }
};

// @desc    Get quiz statistics
// @route   GET /api/admin/quizzes/stats
// @access  Private/Admin
exports.getQuizStats = async (req, res) => {
  try {
    const totalQuizzes = await Quiz.countDocuments();
    const activeQuizzes = await Quiz.countDocuments({ isActive: true });
    const inactiveQuizzes = await Quiz.countDocuments({ isActive: false });

    // Quizzes by difficulty
    const byDifficulty = await Quiz.aggregate([
      {
        $group: {
          _id: '$difficulty',
          count: { $sum: 1 },
        },
      },
    ]);

    // Quizzes by topic
    const byTopic = await Quiz.aggregate([
      {
        $group: {
          _id: '$topic',
          count: { $sum: 1 },
        },
      },
      {
        $sort: { count: -1 },
      },
      {
        $limit: 10,
      },
    ]);

    // Average questions per quiz
    const avgQuestions = await Quiz.aggregate([
      {
        $project: {
          questionCount: { $size: '$questions' },
        },
      },
      {
        $group: {
          _id: null,
          avgQuestions: { $avg: '$questionCount' },
        },
      },
    ]);

    res.status(200).json({
      success: true,
      stats: {
        totalQuizzes,
        activeQuizzes,
        inactiveQuizzes,
        byDifficulty: byDifficulty.reduce((acc, item) => {
          acc[item._id] = item.count;
          return acc;
        }, {}),
        topTopics: byTopic,
        averageQuestionsPerQuiz: avgQuestions[0]?.avgQuestions || 0,
      },
    });
  } catch (error) {
    console.error('Get quiz stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching quiz statistics',
      error: error.message,
    });
  }
};

// @desc    Get all quiz results (scores)
// @route   GET /api/admin/quizzes/results
// @access  Private/Admin
exports.getAllQuizResults = async (req, res) => {
  try {
    const { quizId, userId, page = 1, limit = 20, sortBy = 'createdAt' } = req.query;

    // Build query
    let query = {};

    if (quizId) {
      query.quizId = quizId;
    }

    if (userId) {
      query.userId = userId;
    }

    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Sort options
    const sortOptions = {};
    if (sortBy === 'score') {
      sortOptions.score = -1;
    } else if (sortBy === 'percentage') {
      sortOptions.percentage = -1;
    } else {
      sortOptions.createdAt = -1;
    }

    const results = await Result.find(query)
      .populate('userId', 'name email avatar profile')
      .populate('quizId', 'title topic difficulty')
      .sort(sortOptions)
      .skip(skip)
      .limit(parseInt(limit));

    const totalResults = await Result.countDocuments(query);

    res.status(200).json({
      success: true,
      count: results.length,
      total: totalResults,
      page: parseInt(page),
      pages: Math.ceil(totalResults / parseInt(limit)),
      results,
    });
  } catch (error) {
    console.error('Get all quiz results error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching quiz results',
      error: error.message,
    });
  }
};

// @desc    Get user's quiz details and scores
// @route   GET /api/admin/quizzes/users/:userId
// @access  Private/Admin
exports.getUserQuizDetails = async (req, res) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 10 } = req.query;

    // Get user details
    const user = await User.findById(userId).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Get user's quiz results
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const results = await Result.find({ userId })
      .populate('quizId', 'title topic difficulty questions')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const totalResults = await Result.countDocuments({ userId });

    // Calculate user quiz statistics
    const allUserResults = await Result.find({ userId });
    const totalQuizzes = allUserResults.length;
    const averageScore = totalQuizzes > 0
      ? allUserResults.reduce((sum, r) => sum + r.score, 0) / totalQuizzes
      : 0;
    const averagePercentage = totalQuizzes > 0
      ? allUserResults.reduce((sum, r) => sum + r.percentage, 0) / totalQuizzes
      : 0;
    const bestScore = totalQuizzes > 0
      ? Math.max(...allUserResults.map(r => r.score))
      : 0;
    const bestPercentage = totalQuizzes > 0
      ? Math.max(...allUserResults.map(r => r.percentage))
      : 0;
    const totalCorrectAnswers = allUserResults.reduce((sum, r) => sum + r.correctAnswers, 0);

    res.status(200).json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        profile: user.profile || {},
        badges: user.badges || [],
        coins: user.coins || 0,
      },
      quizStats: {
        totalQuizzes,
        averageScore: Math.round(averageScore * 100) / 100,
        averagePercentage: Math.round(averagePercentage * 100) / 100,
        bestScore,
        bestPercentage,
        totalCorrectAnswers,
      },
      results: {
        count: results.length,
        total: totalResults,
        page: parseInt(page),
        pages: Math.ceil(totalResults / parseInt(limit)),
        data: results,
      },
    });
  } catch (error) {
    console.error('Get user quiz details error:', error);
    
    if (error.kind === 'ObjectId') {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error fetching user quiz details',
      error: error.message,
    });
  }
};

// @desc    Get quiz result by ID with full details
// @route   GET /api/admin/quizzes/results/:id
// @access  Private/Admin
exports.getQuizResultById = async (req, res) => {
  try {
    const result = await Result.findById(req.params.id)
      .populate('userId', 'name email avatar profile badges')
      .populate('quizId', 'title topic difficulty questions');

    if (!result) {
      return res.status(404).json({
        success: false,
        message: 'Quiz result not found',
      });
    }

    res.status(200).json({
      success: true,
      result,
    });
  } catch (error) {
    console.error('Get quiz result by ID error:', error);
    
    if (error.kind === 'ObjectId') {
      return res.status(404).json({
        success: false,
        message: 'Quiz result not found',
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error fetching quiz result',
      error: error.message,
    });
  }
};

