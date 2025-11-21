const Quiz = require('../models/Quiz');
const Result = require('../models/Result');
const { checkAndAwardBadges } = require('../utils/badgeLogic');

// @desc    Get all quizzes
// @route   GET /api/quizzes
// @access  Public
exports.getAllQuizzes = async (req, res) => {
  try {
    const { topic, difficulty, page = 1, limit = 10 } = req.query;

    // Build query
    let query = { isActive: true };

    if (topic) {
      query.topic = { $regex: topic, $options: 'i' };
    }

    if (difficulty) {
      query.difficulty = difficulty;
    }

    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const quizzes = await Quiz.find(query)
      .select('-questions.correctAnswer') // Don't send correct answers
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
    console.error('Get all quizzes error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching quizzes',
      error: error.message,
    });
  }
};

// @desc    Get quiz by ID (without correct answers)
// @route   GET /api/quizzes/:id
// @access  Public
exports.getQuizById = async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.id)
      .select('-questions.correctAnswer'); // Don't send correct answers

    if (!quiz) {
      return res.status(404).json({
        success: false,
        message: 'Quiz not found',
      });
    }

    if (!quiz.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Quiz is not active',
      });
    }

    res.status(200).json({
      success: true,
      quiz,
    });
  } catch (error) {
    console.error('Get quiz by ID error:', error);
    
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

// @desc    Submit quiz and calculate score
// @route   POST /api/quizzes/submit
// @access  Private
exports.submitQuiz = async (req, res) => {
  try {
    const { quizId, userAnswers, durationSeconds } = req.body;
    const userId = req.user.id; // Get from authenticated user

    // Validation
    if (!quizId || !userAnswers || !Array.isArray(userAnswers)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide quizId and userAnswers array',
      });
    }

    // Fetch the quiz with correct answers
    const quiz = await Quiz.findById(quizId);

    if (!quiz) {
      return res.status(404).json({
        success: false,
        message: 'Quiz not found',
      });
    }

    if (!quiz.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Quiz is not active',
      });
    }

    // Calculate score
    let score = 0;
    let correctAnswers = 0;
    const detailedAnswers = [];

    quiz.questions.forEach((question, index) => {
      const userAnswer = userAnswers.find(
        (ans) => ans.questionId === question._id.toString() || ans.questionIndex === index
      );

      const selectedAnswer = userAnswer ? userAnswer.selectedAnswer : '';
      const isCorrect = selectedAnswer === question.correctAnswer;
      const points = isCorrect ? question.points : 0;

      if (isCorrect) {
        score += points;
        correctAnswers++;
      }

      detailedAnswers.push({
        questionIndex: index,
        selectedAnswer,
        isCorrect,
        points,
      });
    });

    const totalQuestions = quiz.questions.length;
    const totalPoints = quiz.questions.reduce((sum, q) => sum + q.points, 0);
    const percentage = totalPoints > 0 ? Math.round((score / totalPoints) * 100) : 0;

    // Create result document
    const result = await Result.create({
      userId,
      quizId,
      score,
      percentage,
      correctAnswers,
      totalQuestions,
      durationSeconds: durationSeconds || null,
      userAnswers: detailedAnswers,
    });

    // Check and award badges
    const newlyAwardedBadges = await checkAndAwardBadges(userId, result, quizId);

    res.status(201).json({
      success: true,
      result: {
        id: result._id,
        score,
        percentage,
        correctAnswers,
        totalQuestions,
        durationSeconds: result.durationSeconds,
        createdAt: result.createdAt,
      },
      newlyAwardedBadges,
      message: newlyAwardedBadges.length > 0
        ? `Congratulations! You earned ${newlyAwardedBadges.length} badge(s)!`
        : 'Quiz submitted successfully',
    });
  } catch (error) {
    console.error('Submit quiz error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error submitting quiz',
      error: error.message,
    });
  }
};

// @desc    Get user's quiz results
// @route   GET /api/quizzes/results/me
// @access  Private
exports.getUserResults = async (req, res) => {
  try {
    const userId = req.user.id; // Get from authenticated user
    const { page = 1, limit = 10 } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const results = await Result.find({ userId })
      .populate('quizId', 'title topic difficulty')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const totalResults = await Result.countDocuments({ userId });

    res.status(200).json({
      success: true,
      count: results.length,
      total: totalResults,
      page: parseInt(page),
      pages: Math.ceil(totalResults / parseInt(limit)),
      results,
    });
  } catch (error) {
    console.error('Get user results error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching results',
      error: error.message,
    });
  }
};

