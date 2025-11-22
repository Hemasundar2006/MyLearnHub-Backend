const User = require('../models/User');
const ChatSession = require('../models/ChatSession');

// @desc    Get user's coin transactions (including chat transactions)
// @route   GET /api/coins/transactions
// @access  Private (User)
exports.getUserCoinTransactions = async (req, res) => {
  try {
    const userId = req.user._id.toString();
    const { page = 1, limit = 20, type, startDate, endDate } = req.query;

    const user = await User.findById(userId).select('coins coinTransactions name email');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Filter transactions
    let filteredTransactions = [...(user.coinTransactions || [])];

    // Filter by type if provided
    if (type) {
      filteredTransactions = filteredTransactions.filter(tx => tx.type === type);
    }

    // Filter by date range if provided
    if (startDate || endDate) {
      filteredTransactions = filteredTransactions.filter(tx => {
        const txDate = new Date(tx.timestamp);
        if (startDate && txDate < new Date(startDate)) return false;
        if (endDate && txDate > new Date(endDate)) return false;
        return true;
      });
    }

    // Sort by timestamp (newest first)
    filteredTransactions.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    // Pagination
    const pageNumber = parseInt(page);
    const limitNumber = parseInt(limit);
    const skip = (pageNumber - 1) * limitNumber;
    const total = filteredTransactions.length;
    const paginatedTransactions = filteredTransactions.slice(skip, skip + limitNumber);

    // Format transactions with chat session details if available
    const formattedTransactions = await Promise.all(
      paginatedTransactions.map(async (transaction) => {
        const formatted = {
          id: transaction._id,
          amount: transaction.amount,
          type: transaction.type,
          reason: transaction.reason,
          timestamp: transaction.timestamp,
          metadata: transaction.metadata || {},
        };

        // If transaction is related to a chat session, include session details
        if (transaction.metadata && transaction.metadata.sessionId) {
          try {
            const session = await ChatSession.findById(transaction.metadata.sessionId)
              .populate('adminId', 'adminName')
              .select('status requestedDuration totalTimeInMinutes totalCoinsSpent startTime endTime');
            
            if (session) {
              formatted.chatSession = {
                id: session._id,
                status: session.status,
                requestedDuration: session.requestedDuration,
                totalTimeInMinutes: session.totalTimeInMinutes,
                totalCoinsSpent: session.totalCoinsSpent,
                startTime: session.startTime,
                endTime: session.endTime,
                admin: session.adminId ? {
                  id: session.adminId._id,
                  name: session.adminId.adminName,
                } : null,
              };
            }
          } catch (error) {
            console.error('Error fetching chat session:', error);
          }
        }

        return formatted;
      })
    );

    res.status(200).json({
      success: true,
      data: {
        currentBalance: user.coins,
        transactions: formattedTransactions,
        pagination: {
          page: pageNumber,
          limit: limitNumber,
          total,
          pages: Math.ceil(total / limitNumber),
        },
        summary: {
          totalTransactions: total,
          totalEarned: filteredTransactions
            .filter(tx => tx.amount > 0)
            .reduce((sum, tx) => sum + tx.amount, 0),
          totalSpent: Math.abs(
            filteredTransactions
              .filter(tx => tx.amount < 0)
              .reduce((sum, tx) => sum + tx.amount, 0)
          ),
        },
      },
    });
  } catch (error) {
    console.error('Get user coin transactions error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching coin transactions',
      error: error.message,
    });
  }
};

// @desc    Get all users' coin transactions (Admin)
// @route   GET /api/admin/coins/transactions
// @access  Private (Admin)
exports.getAllUsersCoinTransactions = async (req, res) => {
  try {
    const { page = 1, limit = 50, userId, type, startDate, endDate, search } = req.query;

    // Build match criteria
    const matchCriteria = {};

    // Filter by specific user if provided
    if (userId) {
      matchCriteria._id = userId;
    }

    // Search by name or email if provided
    if (search) {
      matchCriteria.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    // Aggregate to get all transactions with user info
    const pipeline = [
      { $match: matchCriteria },
      { $unwind: '$coinTransactions' },
    ];

    // Filter by type if provided
    if (type) {
      pipeline.push({
        $match: { 'coinTransactions.type': type },
      });
    }

    // Filter by date range if provided
    if (startDate || endDate) {
      const dateFilter = {};
      if (startDate) {
        dateFilter['coinTransactions.timestamp'] = { $gte: new Date(startDate) };
      }
      if (endDate) {
        dateFilter['coinTransactions.timestamp'] = {
          ...dateFilter['coinTransactions.timestamp'],
          $lte: new Date(endDate),
        };
      }
      pipeline.push({ $match: dateFilter });
    }

    // Sort by timestamp
    pipeline.push({
      $sort: { 'coinTransactions.timestamp': -1 },
    });

    // Project fields
    pipeline.push({
      $project: {
        transactionId: '$coinTransactions._id',
        userId: '$_id',
        userName: '$name',
        userEmail: '$email',
        userAvatar: '$avatar',
        amount: '$coinTransactions.amount',
        type: '$coinTransactions.type',
        reason: '$coinTransactions.reason',
        timestamp: '$coinTransactions.timestamp',
        metadata: '$coinTransactions.metadata',
      },
    });

    // Get total count
    const countPipeline = [...pipeline, { $count: 'total' }];
    const countResult = await User.aggregate(countPipeline);
    const total = countResult[0]?.total || 0;

    // Pagination
    const pageNumber = parseInt(page);
    const limitNumber = parseInt(limit);
    const skip = (pageNumber - 1) * limitNumber;

    pipeline.push({ $skip: skip });
    pipeline.push({ $limit: limitNumber });

    const transactions = await User.aggregate(pipeline);

    // Enrich with chat session details
    const enrichedTransactions = await Promise.all(
      transactions.map(async (tx) => {
        const enriched = { ...tx };

        // If transaction is related to a chat session, include session details
        if (tx.metadata && tx.metadata.sessionId) {
          try {
            const session = await ChatSession.findById(tx.metadata.sessionId)
              .populate('adminId', 'adminName')
              .select('status requestedDuration totalTimeInMinutes totalCoinsSpent startTime endTime');

            if (session) {
              enriched.chatSession = {
                id: session._id,
                status: session.status,
                requestedDuration: session.requestedDuration,
                totalTimeInMinutes: session.totalTimeInMinutes,
                totalCoinsSpent: session.totalCoinsSpent,
                startTime: session.startTime,
                endTime: session.endTime,
                admin: session.adminId ? {
                  id: session.adminId._id,
                  name: session.adminId.adminName,
                } : null,
              };
            }
          } catch (error) {
            console.error('Error fetching chat session:', error);
          }
        }

        return enriched;
      })
    );

    // Calculate summary statistics
    const allTransactions = await User.aggregate([
      { $match: matchCriteria },
      { $unwind: '$coinTransactions' },
      ...(type ? [{ $match: { 'coinTransactions.type': type } }] : []),
      ...(startDate || endDate
        ? [
            {
              $match: {
                'coinTransactions.timestamp': {
                  ...(startDate ? { $gte: new Date(startDate) } : {}),
                  ...(endDate ? { $lte: new Date(endDate) } : {}),
                },
              },
            },
          ]
        : []),
      {
        $project: {
          amount: '$coinTransactions.amount',
          type: '$coinTransactions.type',
        },
      },
    ]);

    const summary = {
      totalTransactions: allTransactions.length,
      totalEarned: allTransactions
        .filter(tx => tx.amount > 0)
        .reduce((sum, tx) => sum + tx.amount, 0),
      totalSpent: Math.abs(
        allTransactions
          .filter(tx => tx.amount < 0)
          .reduce((sum, tx) => sum + tx.amount, 0)
      ),
    };

    res.status(200).json({
      success: true,
      data: {
        transactions: enrichedTransactions,
        pagination: {
          page: pageNumber,
          limit: limitNumber,
          total,
          pages: Math.ceil(total / limitNumber),
        },
        summary,
      },
    });
  } catch (error) {
    console.error('Get all users coin transactions error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching coin transactions',
      error: error.message,
    });
  }
};

// @desc    Get chat member details (users who created chat sessions)
// @route   GET /api/admin/chat/members
// @access  Private (Admin)
exports.getChatMembers = async (req, res) => {
  try {
    const { page = 1, limit = 50, status, startDate, endDate, search } = req.query;

    // Build match criteria for chat sessions
    const matchCriteria = {};

    if (status) {
      matchCriteria.status = status;
    }

    if (startDate || endDate) {
      matchCriteria.createdAt = {};
      if (startDate) {
        matchCriteria.createdAt.$gte = new Date(startDate);
      }
      if (endDate) {
        matchCriteria.createdAt.$lte = new Date(endDate);
      }
    }

    // Get chat sessions with user details
    const sessions = await ChatSession.find(matchCriteria)
      .populate('userId', 'name email avatar coins createdAt')
      .populate('adminId', 'adminName')
      .sort({ createdAt: -1 })
      .lean();

    // Filter by search if provided
    let filteredSessions = sessions;
    if (search) {
      filteredSessions = sessions.filter(session => {
        const userName = session.userId?.name || '';
        const userEmail = session.userId?.email || '';
        return (
          userName.toLowerCase().includes(search.toLowerCase()) ||
          userEmail.toLowerCase().includes(search.toLowerCase())
        );
      });
    }

    // Pagination
    const pageNumber = parseInt(page);
    const limitNumber = parseInt(limit);
    const skip = (pageNumber - 1) * limitNumber;
    const total = filteredSessions.length;
    const paginatedSessions = filteredSessions.slice(skip, skip + limitNumber);

    // Format response with member details
    const members = paginatedSessions.map(session => ({
      sessionId: session._id,
      user: {
        id: session.userId?._id,
        name: session.userId?.name,
        email: session.userId?.email,
        avatar: session.userId?.avatar,
        coins: session.userId?.coins,
        joinedAt: session.userId?.createdAt,
      },
      chat: {
        status: session.status,
        requestedDuration: session.requestedDuration,
        requestedCoins: session.requestedCoins,
        totalTimeInMinutes: session.totalTimeInMinutes,
        totalCoinsSpent: session.totalCoinsSpent,
        startTime: session.startTime,
        endTime: session.endTime,
        createdAt: session.createdAt,
      },
      admin: session.adminId ? {
        id: session.adminId._id,
        name: session.adminId.adminName,
      } : null,
    }));

    // Calculate statistics
    const stats = {
      totalSessions: filteredSessions.length,
      pendingSessions: filteredSessions.filter(s => s.status === 'pending').length,
      activeSessions: filteredSessions.filter(s => s.status === 'active').length,
      closedSessions: filteredSessions.filter(s => s.status === 'closed').length,
      timeoutSessions: filteredSessions.filter(s => s.status === 'timeout').length,
      totalCoinsSpent: filteredSessions.reduce((sum, s) => sum + (s.totalCoinsSpent || 0), 0),
      totalTimeSpent: filteredSessions.reduce((sum, s) => sum + (s.totalTimeInMinutes || 0), 0),
      uniqueUsers: new Set(filteredSessions.map(s => s.userId?._id?.toString()).filter(Boolean)).size,
    };

    res.status(200).json({
      success: true,
      data: {
        members,
        stats,
        pagination: {
          page: pageNumber,
          limit: limitNumber,
          total,
          pages: Math.ceil(total / limitNumber),
        },
      },
    });
  } catch (error) {
    console.error('Get chat members error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching chat members',
      error: error.message,
    });
  }
};

