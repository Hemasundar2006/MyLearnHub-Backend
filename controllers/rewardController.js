const User = require('../models/User');
const rewardConfig = require('../config/rewardConfig');
const {
  normalizeReferralCode,
  enforceHistoryLimit,
  buildReferralSharePayload,
} = require('../utils/referralUtils');

const buildCoinSummary = (transactions = []) => {
  return transactions.reduce(
    (summary, tx) => {
      const amount = Number(tx.amount) || 0;

      if (['spent', 'penalty'].includes(tx.type)) {
        summary.spent += amount;
      } else {
        summary.earned += amount;
      }

      if (tx.type === 'bonus') {
        summary.bonus += amount;
      }

      return summary;
    },
    { earned: 0, spent: 0, bonus: 0 }
  );
};

const sortByTimestampDesc = (items = []) =>
  [...items].sort(
    (a, b) =>
      new Date(b.timestamp || b.completedAt || b.createdAt) -
      new Date(a.timestamp || a.completedAt || a.createdAt)
  );

exports.getRewardDashboard = async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .select(
        'name email coins referralCode referralStats coinTransactions referralHistory referredBy createdAt'
      )
      .populate('referredBy', 'name email avatar')
      .populate('referralHistory.referredUser', 'name email avatar');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    const coinSummary = buildCoinSummary(user.coinTransactions || []);
    const recentTransactions = sortByTimestampDesc(user.coinTransactions || []).slice(
      0,
      5
    );
    const recentReferrals = sortByTimestampDesc(user.referralHistory || [])
      .slice(0, 5)
      .map((entry) => ({
        id: entry._id,
        referredEmail: entry.referredEmail,
        referredName: entry.referredName,
        rewardForReferrer: entry.rewardForReferrer,
        rewardForInvitee: entry.rewardForInvitee,
        status: entry.status,
        completedAt: entry.completedAt || entry.createdAt,
        referredUser: entry.referredUser,
      }));

    res.status(200).json({
      success: true,
      data: {
        coins: {
          balance: user.coins,
          summary: coinSummary,
          recentTransactions,
        },
        referral: {
          ...buildReferralSharePayload(user.referralCode),
          stats: user.referralStats || {
            totalShares: 0,
            totalClicks: 0,
            successfulReferrals: 0,
            totalCoinsEarned: 0,
          },
          referredBy: user.referredBy
            ? {
                id: user.referredBy._id,
                name: user.referredBy.name,
                email: user.referredBy.email,
                avatar: user.referredBy.avatar,
              }
            : null,
          recentHistory: recentReferrals,
        },
      },
    });
  } catch (error) {
    console.error('Get reward dashboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching reward dashboard',
      error: error.message,
    });
  }
};

exports.getReferralHistory = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const pageNumber = Math.max(parseInt(page, 10), 1);
    const pageLimit = Math.max(parseInt(limit, 10), 1);

    const user = await User.findById(req.user.id)
      .select('referralHistory referralCode referralStats')
      .populate('referralHistory.referredUser', 'name email avatar');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    const history = sortByTimestampDesc(user.referralHistory || []);
    const startIndex = (pageNumber - 1) * pageLimit;
    const paginatedHistory = history.slice(startIndex, startIndex + pageLimit);

    res.status(200).json({
      success: true,
      data: {
        share: buildReferralSharePayload(user.referralCode),
        stats: user.referralStats,
        total: history.length,
        page: pageNumber,
        pages: Math.ceil(history.length / pageLimit) || 1,
        history: paginatedHistory,
      },
    });
  } catch (error) {
    console.error('Get referral history error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching referral history',
      error: error.message,
    });
  }
};

exports.getRewardHistory = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const pageNumber = Math.max(parseInt(page, 10), 1);
    const pageLimit = Math.max(parseInt(limit, 10), 1);

    const user = await User.findById(req.user.id).select(
      'coinTransactions referralHistory'
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    const coinEvents = (user.coinTransactions || []).map((tx) => ({
      kind: 'coin',
      amount: tx.amount,
      category: tx.type,
      reason: tx.reason,
      timestamp: tx.timestamp,
      metadata: tx.metadata,
    }));

    const referralEvents = (user.referralHistory || []).map((entry) => ({
      kind: 'referral',
      referredEmail: entry.referredEmail,
      referredName: entry.referredName,
      rewardForReferrer: entry.rewardForReferrer,
      rewardForInvitee: entry.rewardForInvitee,
      status: entry.status,
      timestamp: entry.completedAt || entry.createdAt,
    }));

    const combinedHistory = sortByTimestampDesc([
      ...coinEvents,
      ...referralEvents,
    ]);

    const startIndex = (pageNumber - 1) * pageLimit;
    const paginated = combinedHistory.slice(startIndex, startIndex + pageLimit);

    res.status(200).json({
      success: true,
      data: {
        total: combinedHistory.length,
        page: pageNumber,
        pages: Math.ceil(combinedHistory.length / pageLimit) || 1,
        history: paginated,
      },
    });
  } catch (error) {
    console.error('Get reward history error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching reward history',
      error: error.message,
    });
  }
};

exports.trackReferralVisit = async (req, res) => {
  try {
    const { referralCode } = req.body;

    if (!referralCode) {
      return res.status(400).json({
        success: false,
        message: 'Referral code is required',
      });
    }

    const user = await User.findOne({
      referralCode: normalizeReferralCode(referralCode),
    }).select('referralStats referralCode referralHistory');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Referral code not found',
      });
    }

    user.referralStats = user.referralStats || {};
    user.referralStats.totalClicks =
      (user.referralStats.totalClicks || 0) + 1;
    user.referralStats.totalShares =
      (user.referralStats.totalShares || 0) + 1;

    // Keep referral history trimmed if necessary (no entry added here, but ensures consistency)
    enforceHistoryLimit(user.referralHistory, rewardConfig.referral.historyLimit);

    await user.save();

    res.status(200).json({
      success: true,
      message: 'Referral visit tracked',
    });
  } catch (error) {
    console.error('Track referral visit error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error tracking referral visit',
      error: error.message,
    });
  }
};


