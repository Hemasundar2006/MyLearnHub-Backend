const mongoose = require('mongoose');
const User = require('../models/User');
const { buildReferralSharePayload } = require('../utils/referralUtils');

const parsePositiveInt = (value, fallback) => {
  const parsed = parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

const buildReferralPipelineBase = (status) => {
  const pipeline = [{ $unwind: '$referralHistory' }];

  if (status) {
    pipeline.push({
      $match: { 'referralHistory.status': status },
    });
  }

  return pipeline;
};

exports.getRewardsOverview = async (req, res) => {
  try {
    const [aggregateTotals] = await User.aggregate([
      {
        $project: {
          coins: 1,
          transactionCount: {
            $size: {
              $ifNull: ['$coinTransactions', []],
            },
          },
          successfulReferrals: {
            $ifNull: ['$referralStats.successfulReferrals', 0],
          },
          referralCoins: {
            $ifNull: ['$referralStats.totalCoinsEarned', 0],
          },
          totalShares: {
            $ifNull: ['$referralStats.totalShares', 0],
          },
          totalClicks: {
            $ifNull: ['$referralStats.totalClicks', 0],
          },
        },
      },
      {
        $group: {
          _id: null,
          totalCoinsInCirculation: { $sum: '$coins' },
          totalCoinTransactions: { $sum: '$transactionCount' },
          totalSuccessfulReferrals: { $sum: '$successfulReferrals' },
          totalReferralCoinsAwarded: { $sum: '$referralCoins' },
          totalShares: { $sum: '$totalShares' },
          totalClicks: { $sum: '$totalClicks' },
          totalUsers: { $sum: 1 },
        },
      },
    ]);

    const topReferrers = await User.find({
      'referralStats.successfulReferrals': { $gt: 0 },
    })
      .select('name email avatar referralCode referralStats coins createdAt')
      .sort({ 'referralStats.successfulReferrals': -1 })
      .limit(10)
      .lean()
      .exec();

    const recentReferralEvents = await User.aggregate([
      ...buildReferralPipelineBase(),
      {
        $sort: {
          'referralHistory.completedAt': -1,
          'referralHistory.createdAt': -1,
        },
      },
      { $limit: 15 },
      {
        $lookup: {
          from: 'users',
          localField: 'referralHistory.referredUser',
          foreignField: '_id',
          as: 'invitee',
        },
      },
      {
        $unwind: {
          path: '$invitee',
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $project: {
          _id: 0,
          eventId: '$referralHistory._id',
          referrerId: '$_id',
          referrerName: '$name',
          referrerEmail: '$email',
          referralCode: '$referralCode',
          rewardForReferrer: '$referralHistory.rewardForReferrer',
          rewardForInvitee: '$referralHistory.rewardForInvitee',
          status: '$referralHistory.status',
          referredEmail: '$referralHistory.referredEmail',
          referredName: '$referralHistory.referredName',
          completedAt: {
            $ifNull: ['$referralHistory.completedAt', '$referralHistory.createdAt'],
          },
          invitee: {
            id: '$invitee._id',
            name: '$invitee.name',
            email: '$invitee.email',
          },
        },
      },
    ]);

    const recentCoinTransactions = await User.aggregate([
      {
        $unwind: '$coinTransactions',
      },
      {
        $sort: {
          'coinTransactions.timestamp': -1,
        },
      },
      {
        $limit: 20,
      },
      {
        $project: {
          transactionId: '$coinTransactions._id',
          userId: '$_id',
          userName: '$name',
          userEmail: '$email',
          referralCode: '$referralCode',
          amount: '$coinTransactions.amount',
          type: '$coinTransactions.type',
          reason: '$coinTransactions.reason',
          timestamp: '$coinTransactions.timestamp',
        },
      },
    ]);

    res.status(200).json({
      success: true,
      data: {
        totals: aggregateTotals || {
          totalCoinsInCirculation: 0,
          totalCoinTransactions: 0,
          totalSuccessfulReferrals: 0,
          totalReferralCoinsAwarded: 0,
          totalShares: 0,
          totalClicks: 0,
          totalUsers: 0,
        },
        topReferrers: topReferrers.map((user) => ({
          ...user,
          share: buildReferralSharePayload(user.referralCode),
        })),
        recentReferralEvents,
        recentCoinTransactions,
      },
    });
  } catch (error) {
    console.error('Admin rewards overview error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching rewards overview',
      error: error.message,
    });
  }
};

exports.getRewardUsers = async (req, res) => {
  try {
    const page = parsePositiveInt(req.query.page, 1);
    const limit = parsePositiveInt(req.query.limit, 20);
    const search = req.query.search ? req.query.search.trim() : '';
    const minCoins = Number(req.query.minCoins);
    const sortBy = req.query.sort === 'referrals' ? 'referrals' : req.query.sort === 'createdAt' ? 'createdAt' : 'coins';

    const query = {};

    if (search) {
      const regex = new RegExp(search, 'i');
      query.$or = [{ name: regex }, { email: regex }, { referralCode: regex }];
    }

    if (Number.isFinite(minCoins) && minCoins > 0) {
      query.coins = { $gte: minCoins };
    }

    const sortConfig =
      sortBy === 'referrals'
        ? { 'referralStats.successfulReferrals': -1 }
        : sortBy === 'createdAt'
        ? { createdAt: -1 }
        : { coins: -1 };

    const [users, total] = await Promise.all([
      User.find(query)
        .select('name email avatar coins referralCode referralStats referredBy createdAt')
        .populate('referredBy', 'name email avatar')
        .sort(sortConfig)
        .skip((page - 1) * limit)
        .limit(limit)
        .lean()
        .exec(),
      User.countDocuments(query),
    ]);

    res.status(200).json({
      success: true,
      data: {
        total,
        page,
        pages: Math.ceil(total / limit) || 1,
        users: users.map((user) => ({
          ...user,
          share: buildReferralSharePayload(user.referralCode),
        })),
      },
    });
  } catch (error) {
    console.error('Admin reward users error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching reward users',
      error: error.message,
    });
  }
};

exports.getUserRewardDetails = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid user ID',
      });
    }

    const transactionLimit = parsePositiveInt(req.query.transactionLimit, 50);
    const referralLimit = parsePositiveInt(req.query.referralLimit, 50);

    const user = await User.findById(userId)
      .select(
        'name email avatar role coins referralCode referralStats referredBy coinTransactions referralHistory createdAt'
      )
      .populate('referredBy', 'name email avatar')
      .populate('referralHistory.referredUser', 'name email avatar')
      .lean()
      .exec();

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    const sortedTransactions = [...(user.coinTransactions || [])].sort(
      (a, b) => new Date(b.timestamp) - new Date(a.timestamp)
    );
    const sortedReferrals = [...(user.referralHistory || [])].sort(
      (a, b) =>
        new Date(b.completedAt || b.createdAt) - new Date(a.completedAt || a.createdAt)
    );

    res.status(200).json({
      success: true,
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          avatar: user.avatar,
          role: user.role,
          coins: user.coins,
          referralCode: user.referralCode,
          referralStats: user.referralStats,
          referredBy: user.referredBy,
          share: buildReferralSharePayload(user.referralCode),
          createdAt: user.createdAt,
        },
        transactions: sortedTransactions.slice(0, transactionLimit),
        referralHistory: sortedReferrals.slice(0, referralLimit),
      },
    });
  } catch (error) {
    console.error('Admin user reward details error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching user reward details',
      error: error.message,
    });
  }
};

exports.getReferralEvents = async (req, res) => {
  try {
    const page = parsePositiveInt(req.query.page, 1);
    const limit = parsePositiveInt(req.query.limit, 25);
    const { status } = req.query;
    const basePipeline = buildReferralPipelineBase(status);

    const paginatedPipeline = [
      ...basePipeline,
      {
        $sort: {
          'referralHistory.completedAt': -1,
          'referralHistory.createdAt': -1,
        },
      },
      { $skip: (page - 1) * limit },
      { $limit: limit },
      {
        $lookup: {
          from: 'users',
          localField: 'referralHistory.referredUser',
          foreignField: '_id',
          as: 'invitee',
        },
      },
      {
        $unwind: {
          path: '$invitee',
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $project: {
          _id: 0,
          eventId: '$referralHistory._id',
          referrerId: '$_id',
          referrerName: '$name',
          referrerEmail: '$email',
          referralCode: '$referralCode',
          status: '$referralHistory.status',
          rewardForReferrer: '$referralHistory.rewardForReferrer',
          rewardForInvitee: '$referralHistory.rewardForInvitee',
          referredEmail: '$referralHistory.referredEmail',
          referredName: '$referralHistory.referredName',
          referredUserId: '$referralHistory.referredUser',
          invitee: {
            id: '$invitee._id',
            name: '$invitee.name',
            email: '$invitee.email',
          },
          completedAt: {
            $ifNull: ['$referralHistory.completedAt', '$referralHistory.createdAt'],
          },
          createdAt: '$referralHistory.createdAt',
          note: '$referralHistory.note',
        },
      },
    ];

    const totalPipeline = [...basePipeline, { $count: 'total' }];

    const [events, totalResult] = await Promise.all([
      User.aggregate(paginatedPipeline),
      User.aggregate(totalPipeline),
    ]);

    const total = totalResult[0]?.total || 0;

    res.status(200).json({
      success: true,
      data: {
        total,
        page,
        pages: Math.ceil(total / limit) || 1,
        events,
      },
    });
  } catch (error) {
    console.error('Admin referral events error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching referral events',
      error: error.message,
    });
  }
};


