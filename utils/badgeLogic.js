const User = require('../models/User');
const Badge = require('../models/Badge');
const Quiz = require('../models/Quiz');

/**
 * Check and award badges based on quiz result
 * @param {String} userId - User ID
 * @param {Object} result - Result object with percentage, score, etc.
 * @param {String} quizId - Quiz ID to fetch quiz details
 * @returns {Promise<Array>} Array of newly awarded badges
 */
const checkAndAwardBadges = async (userId, result, quizId) => {
  try {
    const newlyAwardedBadges = [];

    // Fetch user and quiz
    const user = await User.findById(userId);
    const quiz = await Quiz.findById(quizId);

    if (!user || !quiz) {
      console.error('User or Quiz not found for badge checking');
      return newlyAwardedBadges;
    }

    // Get all active badges
    const allBadges = await Badge.find({ isActive: true });

    // Check each badge criteria
    for (const badge of allBadges) {
      // Skip if user already has this badge
      if (user.badges && user.badges.includes(badge._id)) {
        continue;
      }

      let shouldAward = false;

      // Check "Perfect Score" badge
      if (badge.name === 'Perfect Score' || badge.criteria.includes('100%')) {
        if (result.percentage === 100) {
          shouldAward = true;
        }
      }

      // Check "High Achiever" badge
      if (badge.name === 'High Achiever' || badge.criteria.includes('90%') && badge.criteria.includes('Hard')) {
        if (result.percentage >= 90 && quiz.difficulty === 'Hard') {
          shouldAward = true;
        }
      }

      // Generic criteria checking (for extensibility)
      if (!shouldAward) {
        shouldAward = evaluateBadgeCriteria(badge.criteria, result, quiz);
      }

      // Award badge if criteria met
      if (shouldAward) {
        // Use $addToSet to prevent duplicate badges
        await User.findByIdAndUpdate(
          userId,
          { $addToSet: { badges: badge._id } },
          { new: true }
        );

        newlyAwardedBadges.push({
          id: badge._id,
          name: badge.name,
          description: badge.description,
          iconUrl: badge.iconUrl,
        });

        console.log(`Badge "${badge.name}" awarded to user ${userId}`);
      }
    }

    return newlyAwardedBadges;
  } catch (error) {
    console.error('Error in checkAndAwardBadges:', error);
    return [];
  }
};

/**
 * Evaluate badge criteria string against result and quiz
 * @param {String} criteria - Badge criteria string
 * @param {Object} result - Result object
 * @param {Object} quiz - Quiz object
 * @returns {Boolean} Whether criteria is met
 */
const evaluateBadgeCriteria = (criteria, result, quiz) => {
  if (!criteria) return false;

  const criteriaLower = criteria.toLowerCase();

  // Check for percentage-based criteria
  if (criteriaLower.includes('100%') || criteriaLower.includes('perfect')) {
    return result.percentage === 100;
  }

  if (criteriaLower.includes('90%')) {
    const hasHard = criteriaLower.includes('hard') && quiz.difficulty === 'Hard';
    const hasMedium = criteriaLower.includes('medium') && quiz.difficulty === 'Medium';
    const hasEasy = criteriaLower.includes('easy') && quiz.difficulty === 'Easy';
    
    if (hasHard || hasMedium || hasEasy || (!hasHard && !hasMedium && !hasEasy)) {
      return result.percentage >= 90;
    }
  }

  if (criteriaLower.includes('80%')) {
    return result.percentage >= 80;
  }

  // Check for difficulty-based criteria
  if (criteriaLower.includes('hard') && quiz.difficulty !== 'Hard') {
    return false;
  }

  if (criteriaLower.includes('medium') && quiz.difficulty !== 'Medium') {
    return false;
  }

  if (criteriaLower.includes('easy') && quiz.difficulty !== 'Easy') {
    return false;
  }

  return false;
};

module.exports = {
  checkAndAwardBadges,
  evaluateBadgeCriteria,
};

