const mongoose = require('mongoose');
const Quiz = require('../models/Quiz');
const Result = require('../models/Result');
const User = require('../models/User');
const { checkAndAwardBadges } = require('../utils/badgeLogic');
const rewardConfig = require('../config/rewardConfig');
const { enforceHistoryLimit } = require('../utils/referralUtils');

/**
 * Calculate coins to award for quiz completion
 * @param {Number} percentage - Quiz completion percentage (0-100)
 * @param {String} difficulty - Quiz difficulty ('Easy', 'Medium', 'Hard')
 * @returns {Number} - Coins to award
 */
const calculateQuizCoins = (percentage, difficulty) => {
  // Base reward for completing quiz
  const BASE_REWARD = 10;
  
  // Percentage-based bonus
  let percentageBonus = 0;
  if (percentage >= 91) {
    percentageBonus = 20; // Excellent (91-100%)
  } else if (percentage >= 71) {
    percentageBonus = 10; // Good (71-90%)
  } else if (percentage >= 51) {
    percentageBonus = 5;  // Average (51-70%)
  }
  // 0-50% gets no bonus
  
  // Difficulty multiplier
  const difficultyMultiplier = {
    'Easy': 1.0,
    'Medium': 1.5,
    'Hard': 2.0,
  };
  
  const multiplier = difficultyMultiplier[difficulty] || 1.0;
  
  // Calculate total coins
  const totalCoins = Math.round((BASE_REWARD + percentageBonus) * multiplier);
  
  return totalCoins;
};

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

    // Format quizzes to include timeLimit
    const formattedQuizzes = quizzes.map(quiz => ({
      ...quiz.toObject(),
      timeLimit: quiz.timeLimit || null, // Include time limit (null if not set)
    }));

    res.status(200).json({
      success: true,
      count: formattedQuizzes.length,
      total: totalQuizzes,
      page: parseInt(page),
      pages: Math.ceil(totalQuizzes / parseInt(limit)),
      quizzes: formattedQuizzes,
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
// @access  Public (but includes completion status if authenticated)
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

    // Check if user has already completed this quiz (if authenticated)
    let isCompleted = false;
    let userResult = null;
    
    if (req.user && req.user.id) {
      const existingResult = await Result.findOne({
        userId: req.user.id,
        quizId: quiz._id,
      }).sort({ createdAt: -1 }); // Get the latest attempt
      
      if (existingResult) {
        isCompleted = true;
        userResult = {
          id: existingResult._id,
          score: existingResult.score,
          percentage: existingResult.percentage,
          correctAnswers: existingResult.correctAnswers,
          totalQuestions: existingResult.totalQuestions,
          createdAt: existingResult.createdAt,
        };
      }
    }

    res.status(200).json({
      success: true,
      quiz: {
        ...quiz.toObject(),
        timeLimit: quiz.timeLimit || null, // Include time limit
      },
      isCompleted, // Whether user has completed this quiz
      userResult, // User's result if completed (null if not completed or not authenticated)
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
// @route   POST /api/quizzes/submit or POST /api/quizzes/:id/submit
// @access  Private
exports.submitQuiz = async (req, res) => {
  try {
    // Get quizId from URL params or request body
    const quizId = req.params.id || req.body.quizId;
    const { userAnswers, answers, durationSeconds } = req.body;
    const userId = req.user.id; // Get from authenticated user

    // Validation
    if (!quizId) {
      return res.status(400).json({
        success: false,
        message: 'Please provide quizId in URL or request body',
      });
    }

    // Handle different answer formats (allow empty answers for auto-submission)
    let processedAnswers = [];
    let isAutoSubmitted = false;
    
    if (userAnswers !== undefined && Array.isArray(userAnswers)) {
      // Format: [{ questionId: "...", selectedAnswer: "..." }]
      processedAnswers = userAnswers;
      // If empty array, it means user didn't select any option (auto-submission)
      if (userAnswers.length === 0) {
        isAutoSubmitted = true;
      }
    } else if (answers !== undefined && typeof answers === 'object') {
      // Format: { "questionId": "answer", ... }
      const answerEntries = Object.entries(answers);
      processedAnswers = answerEntries.map(([questionId, selectedAnswer]) => ({
        questionId,
        selectedAnswer: String(selectedAnswer),
      }));
      // If empty object, it means user didn't select any option (auto-submission)
      if (answerEntries.length === 0) {
        isAutoSubmitted = true;
      }
    } else {
      // No answers provided - treat as auto-submission with no selections
      processedAnswers = [];
      isAutoSubmitted = true;
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

    // Check if user has already completed this quiz
    const existingResult = await Result.findOne({
      userId,
      quizId: quiz._id,
    }).sort({ createdAt: -1 }); // Get the latest attempt

    if (existingResult) {
      return res.status(409).json({
        success: false,
        message: 'Test already submitted. You have already completed this quiz. You can view your results instead.',
        alreadyCompleted: true,
        testAlreadySubmitted: true, // Additional flag for frontend
        existingResult: {
          id: existingResult._id,
          score: existingResult.score,
          percentage: existingResult.percentage,
          correctAnswers: existingResult.correctAnswers,
          totalQuestions: existingResult.totalQuestions,
          createdAt: existingResult.createdAt,
        },
      });
    }

    // Validate time limit if quiz has one
    if (quiz.timeLimit && durationSeconds !== undefined && durationSeconds !== null) {
      const timeLimitSeconds = quiz.timeLimit;
      if (durationSeconds > timeLimitSeconds) {
        return res.status(400).json({
          success: false,
          message: `Quiz time limit exceeded. Maximum time allowed: ${timeLimitSeconds} seconds (${Math.floor(timeLimitSeconds / 60)} minutes)`,
        });
      }
    }

    // Calculate score
    let score = 0;
    let correctAnswers = 0;
    const detailedAnswers = [];

    quiz.questions.forEach((question, index) => {
      const userAnswer = processedAnswers.find(
        (ans) => ans.questionId === question._id.toString() || ans.questionIndex === index
      );

      const selectedAnswer = userAnswer ? userAnswer.selectedAnswer : '';
      // Trim and normalize comparison for better matching
      const normalizedSelected = selectedAnswer.trim();
      const normalizedCorrect = question.correctAnswer.trim();
      const isCorrect = normalizedSelected === normalizedCorrect;
      
      // Award points only if answer is correct
      const points = isCorrect ? question.points : 0;

      if (isCorrect) {
        score += points;
        correctAnswers++;
      }

      detailedAnswers.push({
        questionIndex: index,
        selectedAnswer: normalizedSelected,
        isCorrect,
        points,
        questionPoints: question.points, // Include question points for reference
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

    // Calculate and award coins for quiz completion
    const coinsEarned = calculateQuizCoins(percentage, quiz.difficulty);
    const user = await User.findById(userId);
    
    if (user) {
      // Add coins to user
      user.coins = (user.coins || 0) + coinsEarned;
      
      // Add transaction record
      user.coinTransactions.push({
        amount: coinsEarned,
        type: 'earned',
        reason: `Quiz completion: ${quiz.title} (${percentage}%)`,
        metadata: {
          quizId: quiz._id.toString(),
          quizTitle: quiz.title,
          quizTopic: quiz.topic,
          quizDifficulty: quiz.difficulty,
          score: score,
          percentage: percentage,
          correctAnswers: correctAnswers,
          totalQuestions: totalQuestions,
          resultId: result._id.toString(),
        },
        timestamp: new Date(),
      });
      
      // Enforce transaction history limit
      const { transactionHistoryLimit } = rewardConfig.coins;
      enforceHistoryLimit(user.coinTransactions, transactionHistoryLimit);
      
      await user.save();
    }

    // Check and award badges
    const newlyAwardedBadges = await checkAndAwardBadges(userId, result, quizId);

    res.status(201).json({
      success: true,
      result: {
        id: result._id,
        score,
        totalPoints,
        percentage,
        correctAnswers,
        totalQuestions,
        pointsEarned: score, // Explicit points earned
        durationSeconds: result.durationSeconds,
        createdAt: result.createdAt,
      },
      detailedAnswers, // Include detailed answer breakdown
      newlyAwardedBadges,
      coinsEarned, // Coins earned from quiz completion
      isAutoSubmitted, // Indicate if this was an auto-submission
      message: isAutoSubmitted
        ? `Time's up! Your quiz has been automatically submitted. You scored ${score} points (${percentage}%) and earned ${coinsEarned} coins!`
        : newlyAwardedBadges.length > 0
        ? `Congratulations! You earned ${newlyAwardedBadges.length} badge(s), ${score} points, and ${coinsEarned} coins!`
        : `Quiz submitted successfully! You earned ${score} points and ${coinsEarned} coins!`,
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

// @desc    Get quiz leaderboard (top performers)
// @route   GET /api/quizzes/leaderboard
// @access  Public
exports.getQuizLeaderboard = async (req, res) => {
  try {
    const { quizId, limit = 100, sortBy = 'percentage' } = req.query;
    const limitNum = parseInt(limit);

    let matchStage = {};
    if (quizId) {
      matchStage.quizId = new mongoose.Types.ObjectId(quizId);
    }

    // Validate sortBy
    const validSortFields = ['percentage', 'score', 'correctAnswers', 'createdAt'];
    const sortField = validSortFields.includes(sortBy) ? sortBy : 'percentage';

    // Aggregation pipeline for quiz leaderboard
    const leaderboard = await Result.aggregate([
      // Match results (optionally filter by quizId)
      {
        $match: matchStage,
      },
      // Lookup user details
      {
        $lookup: {
          from: 'users',
          localField: 'userId',
          foreignField: '_id',
          as: 'user',
        },
      },
      {
        $unwind: '$user',
      },
      // Filter only active users
      {
        $match: {
          'user.isActive': true,
          'user.role': 'user',
        },
      },
      // Lookup quiz details if quizId not specified
      ...(quizId ? [] : [{
        $lookup: {
          from: 'quizzes',
          localField: 'quizId',
          foreignField: '_id',
          as: 'quiz',
        },
      }, {
        $unwind: '$quiz',
      }]),
      // Group by user to get best scores
      {
        $group: {
          _id: '$userId',
          user: { $first: '$user' },
          bestScore: { $max: '$score' },
          bestPercentage: { $max: '$percentage' },
          totalQuizzes: { $sum: 1 },
          totalCorrectAnswers: { $sum: '$correctAnswers' },
          averagePercentage: { $avg: '$percentage' },
          quizDetails: quizId ? { $first: '$quizId' } : { $first: '$quiz' },
          latestAttempt: { $max: '$createdAt' },
        },
      },
      // Project final structure
      {
        $project: {
          userId: '$_id',
          username: { $ifNull: ['$user.name', '$user.email'] },
          email: '$user.email',
          avatar: '$user.avatar',
          bestScore: 1,
          bestPercentage: { $round: ['$bestPercentage', 2] },
          averagePercentage: { $round: ['$averagePercentage', 2] },
          totalQuizzes: 1,
          totalCorrectAnswers: 1,
          quizDetails: 1,
          latestAttempt: 1,
        },
      },
      // Sort by specified field
      {
        $sort: sortField === 'createdAt' 
          ? { latestAttempt: -1 }
          : { [sortField]: -1, latestAttempt: -1 },
      },
      // Limit results
      {
        $limit: limitNum > 0 && limitNum <= 1000 ? limitNum : 100,
      },
    ]);

    // Add rank to each user
    const leaderboardWithRank = leaderboard.map((user, index) => ({
      rank: index + 1,
      ...user,
    }));

    res.status(200).json({
      success: true,
      count: leaderboardWithRank.length,
      sortBy: sortField,
      leaderboard: leaderboardWithRank,
    });
  } catch (error) {
    console.error('Get quiz leaderboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching quiz leaderboard',
      error: error.message,
    });
  }
};

// @desc    Check if user has completed a specific quiz
// @route   GET /api/quizzes/:id/check-completion
// @access  Private
exports.checkQuizCompletion = async (req, res) => {
  try {
    const { id: quizId } = req.params;
    const userId = req.user.id;

    // Check if quiz exists
    const quiz = await Quiz.findById(quizId);
    if (!quiz) {
      return res.status(404).json({
        success: false,
        message: 'Quiz not found',
      });
    }

    // Check if user has completed this quiz
    const existingResult = await Result.findOne({
      userId,
      quizId,
    }).sort({ createdAt: -1 }); // Get the latest attempt

    if (existingResult) {
      return res.status(200).json({
        success: true,
        isCompleted: true,
        testAlreadySubmitted: true,
        message: 'Test already submitted. You have already completed this quiz.',
        result: {
          id: existingResult._id,
          score: existingResult.score,
          percentage: existingResult.percentage,
          correctAnswers: existingResult.correctAnswers,
          totalQuestions: existingResult.totalQuestions,
          createdAt: existingResult.createdAt,
        },
      });
    }

    return res.status(200).json({
      success: true,
      isCompleted: false,
      message: 'You have not completed this quiz yet',
    });
  } catch (error) {
    console.error('Check quiz completion error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error checking quiz completion',
      error: error.message,
    });
  }
};

// @desc    Get user's quiz result for a specific quiz
// @route   GET /api/quizzes/:id/my-result
// @access  Private
exports.getUserQuizResult = async (req, res) => {
  try {
    const { id: quizId } = req.params;
    const userId = req.user.id;

    // Check if quiz exists
    const quiz = await Quiz.findById(quizId).select('title topic difficulty');
    if (!quiz) {
      return res.status(404).json({
        success: false,
        message: 'Quiz not found',
      });
    }

    // Get user's result for this quiz
    const result = await Result.findOne({
      userId,
      quizId,
    })
      .populate('quizId', 'title topic difficulty')
      .sort({ createdAt: -1 }); // Get the latest attempt

    if (!result) {
      return res.status(404).json({
        success: false,
        message: 'You have not completed this quiz yet',
      });
    }

    res.status(200).json({
      success: true,
      result,
    });
  } catch (error) {
    console.error('Get user quiz result error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching quiz result',
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

