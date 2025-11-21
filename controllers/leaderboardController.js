const User = require('../models/User');

// @desc    Get badge-based leaderboard
// @route   GET /api/leaderboard/badges
// @access  Public
exports.getBadgeLeaderboard = async (req, res) => {
  try {
    const { limit = 100 } = req.query;
    const limitNum = parseInt(limit);

    // Use aggregation pipeline to calculate badge count and rank users
    const leaderboard = await User.aggregate([
      // Match only active users
      {
        $match: {
          isActive: true,
          role: 'user', // Exclude admins from leaderboard
        },
      },
      // Project to calculate badge count
      {
        $project: {
          username: { $ifNull: ['$name', '$email'] }, // Use name or email as username
          email: 1,
          avatar: 1,
          badgeCount: {
            $cond: {
              if: { $isArray: '$badges' },
              then: { $size: '$badges' },
              else: 0,
            },
          },
          badges: 1,
          createdAt: 1,
        },
      },
      // Sort by badge count (descending), then by creation date (ascending) for tie-breaking
      {
        $sort: {
          badgeCount: -1,
          createdAt: 1,
        },
      },
      // Limit results
      {
        $limit: limitNum > 0 && limitNum <= 1000 ? limitNum : 100,
      },
      // Lookup badge details
      {
        $lookup: {
          from: 'badges',
          localField: 'badges',
          foreignField: '_id',
          as: 'badgeDetails',
        },
      },
      // Project final structure
      {
        $project: {
          username: 1,
          email: 1,
          avatar: 1,
          badgeCount: 1,
          badges: {
            $map: {
              input: '$badgeDetails',
              as: 'badge',
              in: {
                id: '$$badge._id',
                name: '$$badge.name',
                description: '$$badge.description',
                iconUrl: '$$badge.iconUrl',
              },
            },
          },
          createdAt: 1,
        },
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
      leaderboard: leaderboardWithRank,
    });
  } catch (error) {
    console.error('Get badge leaderboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching badge leaderboard',
      error: error.message,
    });
  }
};

// @desc    Get user's rank in badge leaderboard
// @route   GET /api/leaderboard/badges/rank/:userId
// @access  Private
exports.getUserBadgeRank = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Get user's badge count
    const badgeCount = user.badges ? user.badges.length : 0;

    // More accurate rank calculation using aggregation
    const rankResult = await User.aggregate([
      {
        $match: {
          isActive: true,
          role: 'user',
        },
      },
      {
        $project: {
          _id: 1,
          badgeCount: {
            $cond: {
              if: { $isArray: '$badges' },
              then: { $size: '$badges' },
              else: 0,
            },
          },
        },
      },
      {
        $sort: { badgeCount: -1, _id: 1 },
      },
      {
        $group: {
          _id: null,
          users: { $push: { userId: '$_id', badgeCount: '$badgeCount' } },
        },
      },
      {
        $unwind: {
          path: '$users',
          includeArrayIndex: 'rank',
        },
      },
      {
        $match: {
          'users.userId': user._id,
        },
      },
      {
        $project: {
          rank: { $add: ['$rank', 1] },
          badgeCount: '$users.badgeCount',
        },
      },
    ]);

    const rank = rankResult.length > 0 ? rankResult[0].rank : null;

    res.status(200).json({
      success: true,
      user: {
        id: user._id,
        username: user.name || user.email,
        email: user.email,
        avatar: user.avatar,
        badgeCount,
        rank,
      },
    });
  } catch (error) {
    console.error('Get user badge rank error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching user rank',
      error: error.message,
    });
  }
};

