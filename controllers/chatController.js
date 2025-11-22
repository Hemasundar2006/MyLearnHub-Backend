const ChatSession = require('../models/ChatSession');
const ChatMessage = require('../models/ChatMessage');
const User = require('../models/User');
const Admin = require('../models/Admin');
const { emitToAdmins, emitToUser, emitToAdmin } = require('../services/socketService');

// Constants
const COINS_PER_MINUTE = 10;
const MINIMUM_COINS_REQUIRED = 30;

// @desc    Get chat request constraints (for slider)
// @route   GET /api/chat/request/constraints
// @access  Private (User)
exports.getChatRequestConstraints = async (req, res) => {
  try {
    const userId = req.user._id.toString();

    // Get user with coins
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Check if user has minimum coins
    if (user.coins < MINIMUM_COINS_REQUIRED) {
      const maxMinutesFromCoins = Math.floor(user.coins / COINS_PER_MINUTE);
      const maxMinutes = Math.min(30, maxMinutesFromCoins);
      
      return res.status(200).json({
        success: true,
        currentCoins: user.coins,
        maxMinutes: maxMinutes,
        minMinutes: 1,
        defaultMinutes: 1,
        coinsPerMinute: COINS_PER_MINUTE,
        minimumCoinsRequired: MINIMUM_COINS_REQUIRED,
        canRequest: false,
        warning: {
          type: 'insufficient_minimum',
          message: `Minimum ${MINIMUM_COINS_REQUIRED} coins required to start a chat. You have ${user.coins} coins.`,
          requiredCoins: MINIMUM_COINS_REQUIRED,
          shortfall: MINIMUM_COINS_REQUIRED - user.coins,
        },
        maxAffordableMinutes: maxMinutes,
        maxAffordableCoins: maxMinutes * COINS_PER_MINUTE,
        sliderStep: 1,
      });
    }

    // Calculate max minutes: min(30 minutes, available coins / 10)
    const maxMinutesFromCoins = Math.floor(user.coins / COINS_PER_MINUTE);
    const maxMinutes = Math.min(30, maxMinutesFromCoins);

    // Default selected minutes (minimum 1 minute, or max if less than 1)
    const defaultMinutes = Math.max(1, Math.min(5, maxMinutes));

    // Calculate max affordable coins
    const maxAffordableCoins = maxMinutes * COINS_PER_MINUTE;

    res.status(200).json({
      success: true,
      currentCoins: user.coins,
      maxMinutes: maxMinutes,
      minMinutes: 1,
      defaultMinutes: defaultMinutes,
      coinsPerMinute: COINS_PER_MINUTE,
      minimumCoinsRequired: MINIMUM_COINS_REQUIRED,
      canRequest: true,
      maxAffordableMinutes: maxMinutes,
      maxAffordableCoins: maxAffordableCoins,
      sliderStep: 1,
      warning: null,
    });
  } catch (error) {
    console.error('Get chat request constraints error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching chat request constraints',
      error: error.message,
    });
  }
};

// @desc    Calculate coins for duration (real-time calculation)
// @route   POST /api/chat/request/calculate
// @access  Private (User)
exports.calculateChatCoins = async (req, res) => {
  try {
    const { minutes } = req.body;
    const userId = req.user._id.toString();

    // Validate minutes
    if (!minutes || typeof minutes !== 'number' || minutes < 1 || minutes > 30) {
      return res.status(400).json({
        success: false,
        message: 'Minutes must be between 1 and 30',
        validRange: { min: 1, max: 30 },
      });
    }

    // Get user with coins
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Calculate coins needed
    const coinsNeeded = minutes * COINS_PER_MINUTE;

    // Calculate max minutes user can afford
    const maxMinutesFromCoins = Math.floor(user.coins / COINS_PER_MINUTE);
    const maxMinutes = Math.min(30, maxMinutesFromCoins);
    const maxAffordableCoins = maxMinutes * COINS_PER_MINUTE;

    // Check if user has enough coins
    const hasEnoughCoins = user.coins >= coinsNeeded;
    const canAfford = minutes <= maxMinutes;
    const remainingCoins = user.coins - coinsNeeded;
    const exceedsBalance = coinsNeeded > user.coins;

    // Determine warning type and message
    let warning = null;
    let suggestedMinutes = null;

    if (!canAfford) {
      if (user.coins < MINIMUM_COINS_REQUIRED) {
        warning = {
          type: 'insufficient_minimum',
          message: `Minimum ${MINIMUM_COINS_REQUIRED} coins required. You have ${user.coins} coins.`,
          severity: 'error',
        };
      } else if (exceedsBalance) {
        warning = {
          type: 'exceeds_balance',
          message: `Selected duration requires ${coinsNeeded} coins, but you only have ${user.coins} coins.`,
          severity: 'error',
          shortfall: coinsNeeded - user.coins,
        };
        suggestedMinutes = maxMinutes;
      } else if (minutes > maxMinutes) {
        warning = {
          type: 'exceeds_max_affordable',
          message: `Maximum affordable duration is ${maxMinutes} minutes (${maxAffordableCoins} coins).`,
          severity: 'warning',
        };
        suggestedMinutes = maxMinutes;
      }
    }

    // Check if balance changed (for auto-adjust)
    const canRequestChat = hasEnoughCoins && canAfford && user.coins >= MINIMUM_COINS_REQUIRED;

    res.status(200).json({
      success: true,
      minutes: minutes,
      coinsNeeded: coinsNeeded,
      currentCoins: user.coins,
      remainingCoins: remainingCoins,
      hasEnoughCoins: hasEnoughCoins,
      canAfford: canAfford,
      canRequestChat: canRequestChat,
      maxMinutes: maxMinutes,
      maxAffordableMinutes: maxMinutes,
      maxAffordableCoins: maxAffordableCoins,
      coinsPerMinute: COINS_PER_MINUTE,
      minimumCoinsRequired: MINIMUM_COINS_REQUIRED,
      warning: warning,
      suggestedMinutes: suggestedMinutes,
      // Display values for UI
      display: {
        time: `${minutes} ${minutes === 1 ? 'minute' : 'minutes'}`,
        coins: `${coinsNeeded} coins`,
        remaining: remainingCoins >= 0 ? `${remainingCoins} coins remaining` : `Insufficient by ${Math.abs(remainingCoins)} coins`,
        maxAffordable: maxMinutes > 0 ? `Max affordable: ${maxMinutes} minutes (${maxAffordableCoins} coins)` : 'Insufficient coins',
      },
    });
  } catch (error) {
    console.error('Calculate chat coins error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error calculating chat coins',
      error: error.message,
    });
  }
};

// @desc    Check balance and auto-adjust slider if needed
// @route   GET /api/chat/request/balance-check
// @access  Private (User)
exports.checkBalanceAndAdjust = async (req, res) => {
  try {
    const { currentSelectedMinutes } = req.query;
    const userId = req.user._id.toString();

    // Get user with coins
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Calculate max minutes user can afford
    const maxMinutesFromCoins = Math.floor(user.coins / COINS_PER_MINUTE);
    const maxMinutes = Math.min(30, maxMinutesFromCoins);
    const maxAffordableCoins = maxMinutes * COINS_PER_MINUTE;

    // Parse current selected minutes
    const selectedMinutes = currentSelectedMinutes ? parseInt(currentSelectedMinutes) : null;

    // Check if balance changed and adjustment needed
    let needsAdjustment = false;
    let adjustedMinutes = null;
    let reason = null;

    if (selectedMinutes) {
      const coinsNeeded = selectedMinutes * COINS_PER_MINUTE;
      
      if (user.coins < MINIMUM_COINS_REQUIRED) {
        needsAdjustment = true;
        adjustedMinutes = 0;
        reason = 'insufficient_minimum';
      } else if (coinsNeeded > user.coins) {
        needsAdjustment = true;
        adjustedMinutes = maxMinutes;
        reason = 'exceeds_balance';
      } else if (selectedMinutes > maxMinutes) {
        needsAdjustment = true;
        adjustedMinutes = maxMinutes;
        reason = 'exceeds_max_affordable';
      }
    }

    res.status(200).json({
      success: true,
      currentCoins: user.coins,
      maxMinutes: maxMinutes,
      maxAffordableCoins: maxAffordableCoins,
      needsAdjustment: needsAdjustment,
      adjustedMinutes: adjustedMinutes,
      reason: reason,
      canRequest: user.coins >= MINIMUM_COINS_REQUIRED,
      message: needsAdjustment 
        ? `Balance changed. Adjusted to ${adjustedMinutes} minutes (${adjustedMinutes * COINS_PER_MINUTE} coins).`
        : 'Balance is sufficient for selected duration.',
    });
  } catch (error) {
    console.error('Check balance and adjust error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error checking balance',
      error: error.message,
    });
  }
};

// @desc    Request a chat session
// @route   POST /api/chat/request
// @access  Private (User)
exports.requestChat = async (req, res) => {
  try {
    const { minutes } = req.body;
    const userId = req.user._id.toString();

    // Check if user has an active or pending session
    const existingSession = await ChatSession.findOne({
      userId,
      status: { $in: ['pending', 'active'] },
    });

    if (existingSession) {
      return res.status(400).json({
        success: false,
        message: 'You already have an active or pending chat session',
        sessionId: existingSession._id,
      });
    }

    // Get user with coins
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Validate and process minutes
    let requestedMinutes = minutes;
    
    // If minutes not provided, use default (minimum 1 minute)
    if (!requestedMinutes || typeof requestedMinutes !== 'number') {
      // Calculate max minutes user can afford
      const maxMinutesFromCoins = Math.floor(user.coins / COINS_PER_MINUTE);
      const maxMinutes = Math.min(30, maxMinutesFromCoins);
      requestedMinutes = Math.max(1, Math.min(5, maxMinutes)); // Default to 5 minutes or max if less
    }

    // Validate minutes range
    if (requestedMinutes < 1 || requestedMinutes > 30) {
      return res.status(400).json({
        success: false,
        message: 'Minutes must be between 1 and 30',
      });
    }

    // Calculate coins needed
    const coinsNeeded = requestedMinutes * COINS_PER_MINUTE;

    // Check if user has minimum coins
    if (user.coins < MINIMUM_COINS_REQUIRED) {
      return res.status(400).json({
        success: false,
        message: `Insufficient coins. Minimum ${MINIMUM_COINS_REQUIRED} coins required to start a chat.`,
        currentCoins: user.coins,
        requiredCoins: MINIMUM_COINS_REQUIRED,
      });
    }

    // Check if user has enough coins for requested duration
    if (user.coins < coinsNeeded) {
      const maxMinutesFromCoins = Math.floor(user.coins / COINS_PER_MINUTE);
      const maxMinutes = Math.min(30, maxMinutesFromCoins);
      const maxAffordableCoins = maxMinutes * COINS_PER_MINUTE;
      const shortfall = coinsNeeded - user.coins;
      
      return res.status(400).json({
        success: false,
        message: `Insufficient coins for ${requestedMinutes} minutes. You need ${coinsNeeded} coins but only have ${user.coins}.`,
        currentCoins: user.coins,
        requestedMinutes: requestedMinutes,
        coinsNeeded: coinsNeeded,
        shortfall: shortfall,
        maxMinutes: maxMinutes,
        maxAffordableMinutes: maxMinutes,
        maxCoinsAvailable: maxAffordableCoins,
        canRequest: false,
        warning: {
          type: 'insufficient_coins',
          message: `Selected duration requires ${coinsNeeded} coins, but you only have ${user.coins} coins. Maximum affordable: ${maxMinutes} minutes.`,
          severity: 'error',
        },
        suggestedMinutes: maxMinutes,
      });
    }

    // Create new chat session with requested duration (coins NOT deducted yet)
    const chatSession = await ChatSession.create({
      userId,
      status: 'pending',
      requestedDuration: requestedMinutes,
      requestedCoins: coinsNeeded,
    });

    // Populate user info for Socket.IO event
    await chatSession.populate('userId', 'name email');

    // Emit chat request to all online admins
    emitToAdmins('chatRequest', {
      sessionId: chatSession._id,
      userId: chatSession.userId._id,
      userName: chatSession.userId.name,
      userEmail: chatSession.userId.email,
      requestedDuration: requestedMinutes,
      requestedCoins: coinsNeeded,
      userCoins: user.coins,
      createdAt: chatSession.createdAt,
    });

    // Calculate remaining coins after request (for display only, not actually deducted)
    const remainingCoins = user.coins - coinsNeeded;

    res.status(201).json({
      success: true,
      message: 'Chat request created successfully. Coins will be deducted when admin accepts.',
      session: {
        id: chatSession._id,
        status: chatSession.status,
        userId: chatSession.userId,
        requestedDuration: chatSession.requestedDuration,
        requestedCoins: chatSession.requestedCoins,
        createdAt: chatSession.createdAt,
      },
      coins: {
        current: user.coins,
        willBeDeducted: coinsNeeded,
        willRemain: remainingCoins,
      },
      coinsNeeded: coinsNeeded,
      remainingCoins: remainingCoins,
      display: {
        time: `${requestedMinutes} ${requestedMinutes === 1 ? 'minute' : 'minutes'}`,
        coins: `${coinsNeeded} coins`,
        remaining: `${remainingCoins} coins will remain after acceptance`,
      },
    });
  } catch (error) {
    console.error('Request chat error:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({
      success: false,
      message: 'Server error creating chat request',
      error: process.env.NODE_ENV === 'development' ? error.message : 'An error occurred while creating the chat request',
      ...(process.env.NODE_ENV === 'development' && { stack: error.stack }),
    });
  }
};

// @desc    Accept a chat request
// @route   POST /api/chat/accept/:sessionId
// @access  Private (Admin)
exports.acceptChat = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const adminId = req.admin._id.toString();

    // Find the chat session
    const chatSession = await ChatSession.findById(sessionId);

    if (!chatSession) {
      return res.status(404).json({
        success: false,
        message: 'Chat session not found',
      });
    }

    // Check if session is pending
    if (chatSession.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: `Chat session is already ${chatSession.status}`,
      });
    }

    // Get user and check coins
    const user = await User.findById(chatSession.userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Check if user has minimum coins
    if (user.coins < MINIMUM_COINS_REQUIRED) {
      // Update session status to closed
      chatSession.status = 'closed';
      chatSession.endTime = new Date();
      await chatSession.save();

      return res.status(400).json({
        success: false,
        message: 'User no longer has sufficient coins to start the chat',
      });
    }

    // Check if user has enough coins for requested duration
    const requestedCoins = chatSession.requestedCoins || (chatSession.requestedDuration * COINS_PER_MINUTE);
    if (user.coins < requestedCoins) {
      // Update session status to closed
      chatSession.status = 'closed';
      chatSession.endTime = new Date();
      await chatSession.save();

      return res.status(400).json({
        success: false,
        message: `User has insufficient coins. Required: ${requestedCoins}, Available: ${user.coins}`,
        requiredCoins: requestedCoins,
        availableCoins: user.coins,
      });
    }

    // Deduct coins when admin accepts
    const originalCoins = user.coins;
    user.coins = user.coins - requestedCoins;

    // Add transaction record
    user.coinTransactions.push({
      amount: -requestedCoins,
      type: 'spent',
      reason: `Chat session started (${chatSession.requestedDuration || 'N/A'} minutes) - Coins deducted on acceptance`,
      metadata: {
        action: 'chat_accepted',
        sessionId: chatSession._id,
        requestedDuration: chatSession.requestedDuration,
        requestedCoins: requestedCoins,
      },
      timestamp: new Date(),
    });

    // Save user with coins deducted
    try {
      await user.save();
      console.log(`✅ Deducted ${requestedCoins} coins when admin accepted chat. Balance: ${originalCoins} → ${user.coins}`);
    } catch (saveError) {
      console.error('Error saving user after coin deduction:', saveError);
      return res.status(500).json({
        success: false,
        message: 'Error deducting coins for chat session',
        error: saveError.message,
      });
    }

    // Accept the chat
    chatSession.adminId = adminId;
    chatSession.status = 'active';
    chatSession.startTime = new Date();
    chatSession.lastBillingTime = new Date();
    await chatSession.save();

    // Emit coin update to user via Socket.IO
    try {
      emitToUser(user._id.toString(), 'coinUpdate', {
        coins: user.coins,
        debited: requestedCoins,
        previousBalance: originalCoins,
        sessionId: chatSession._id.toString(),
        message: `${requestedCoins} coins deducted - Chat started`,
      });
    } catch (emitError) {
      console.error('Error emitting coin update:', emitError);
      // Don't fail the request if emit fails
    }

    // Populate admin and user info
    await chatSession.populate('adminId', 'adminName');
    await chatSession.populate('userId', 'name email');

    // Emit chat started to user
    emitToUser(chatSession.userId._id.toString(), 'chatStarted', {
      sessionId: chatSession._id,
      adminId: chatSession.adminId._id,
      adminName: chatSession.adminId.adminName,
      startTime: chatSession.startTime,
    });

    // Emit chat started to admin
    emitToAdmin(adminId, 'chatStarted', {
      sessionId: chatSession._id,
      userId: chatSession.userId._id,
      userName: chatSession.userId.name,
      startTime: chatSession.startTime,
    });

    res.status(200).json({
      success: true,
      message: 'Chat session accepted. Coins have been deducted.',
      session: {
        id: chatSession._id,
        status: chatSession.status,
        userId: chatSession.userId,
        adminId: chatSession.adminId,
        startTime: chatSession.startTime,
        requestedDuration: chatSession.requestedDuration,
        requestedCoins: requestedCoins,
      },
      coins: {
        debited: requestedCoins,
        previousBalance: originalCoins,
        newBalance: user.coins,
      },
    });
  } catch (error) {
    console.error('Accept chat error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error accepting chat',
      error: error.message,
    });
  }
};

// @desc    End a chat session
// @route   POST /api/chat/end/:sessionId
// @access  Private (User or Admin)
exports.endChat = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const userId = req.user?._id?.toString();
    const adminId = req.admin?._id?.toString();

    // Find the chat session
    const chatSession = await ChatSession.findById(sessionId)
      .populate('userId', 'name email coins')
      .populate('adminId', 'adminName');

    if (!chatSession) {
      return res.status(404).json({
        success: false,
        message: 'Chat session not found',
      });
    }

    // Verify authorization
    const sessionUserId = chatSession.userId._id ? chatSession.userId._id.toString() : chatSession.userId.toString();
    const sessionAdminId = chatSession.adminId?._id ? chatSession.adminId._id.toString() : chatSession.adminId?.toString();

    if (userId && sessionUserId !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to end this chat session',
      });
    }

    if (adminId && chatSession.adminId && sessionAdminId !== adminId) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to end this chat session',
      });
    }

    // Check if session is active
    if (chatSession.status !== 'active') {
      return res.status(400).json({
        success: false,
        message: `Chat session is not active. Current status: ${chatSession.status}`,
      });
    }

    // Calculate total time and coins
    const endTime = new Date();
    const startTime = chatSession.startTime || chatSession.createdAt;
    const timeDiff = endTime - startTime;
    const totalMinutes = Math.ceil(timeDiff / (1000 * 60));
    const totalCoinsNeeded = totalMinutes * COINS_PER_MINUTE;

    // Get user ID (handle both populated and non-populated)
    const userIdToDebit = chatSession.userId._id || chatSession.userId;

    // Get fresh user data
    const user = await User.findById(userIdToDebit);
    if (!user) {
      console.error(`User not found for session ${sessionId}`);
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Store original coins for logging
    const originalCoins = user.coins;
    
    // Check if coins were already deducted on acceptance
    const coinsAlreadyDeductedOnAccept = chatSession.requestedCoins && chatSession.requestedCoins > 0;
    
    let coinsToAdjust = 0;
    let finalCoins = user.coins;
    let alreadyDeducted = 0;

    if (coinsAlreadyDeductedOnAccept) {
      // Coins were deducted when admin accepted - calculate adjustment
      alreadyDeducted = chatSession.requestedCoins;
      coinsToAdjust = totalCoinsNeeded - alreadyDeducted;
      
      console.log(`📊 Session ${sessionId}: Coins deducted on accept: ${alreadyDeducted}, Total needed: ${totalCoinsNeeded}, Adjustment: ${coinsToAdjust}`);
    } else {
      // Coins not deducted on accept - use per-minute billing
      // Get all transactions for this session
      const sessionTransactions = user.coinTransactions.filter(
        tx => tx.metadata && tx.metadata.sessionId && 
        tx.metadata.sessionId.toString() === chatSession._id.toString()
      );
      
      alreadyDeducted = Math.abs(
        sessionTransactions
          .filter(tx => tx.amount < 0)
          .reduce((sum, tx) => sum + tx.amount, 0)
      );
      
      coinsToAdjust = totalCoinsNeeded - alreadyDeducted;
      console.log(`📊 Session ${sessionId}: Total needed: ${totalCoinsNeeded}, Already deducted: ${alreadyDeducted}, Adjustment: ${coinsToAdjust}`);
    }

    if (coinsToAdjust > 0) {
      // Need to debit additional coins (chat ran longer than expected)
      finalCoins = Math.max(0, user.coins - coinsToAdjust);
      user.coins = finalCoins;

      // Add transaction record for additional deduction
      user.coinTransactions.push({
        amount: -coinsToAdjust,
        type: 'spent',
        reason: `Chat session additional time (${totalMinutes} minutes total, ${coinsToAdjust} coins additional)`,
        metadata: {
          sessionId: chatSession._id,
          totalMinutes,
          additionalCoins: coinsToAdjust,
        },
        timestamp: new Date(),
      });
    } else if (coinsToAdjust < 0) {
      // Refund excess coins (chat ended earlier than requested)
      const refundAmount = Math.abs(coinsToAdjust);
      finalCoins = user.coins + refundAmount;
      user.coins = finalCoins;

      // Add transaction record for refund
      user.coinTransactions.push({
        amount: refundAmount,
        type: 'bonus',
        reason: `Chat session refund (${totalMinutes} minutes used, ${refundAmount} coins refunded)`,
        metadata: {
          sessionId: chatSession._id,
          totalMinutes,
          refundAmount: refundAmount,
        },
        timestamp: new Date(),
      });
    }
    // If coinsToAdjust === 0, no adjustment needed (exact amount already deducted)

    // Update session
    chatSession.endTime = endTime;
    chatSession.totalTimeInMinutes = totalMinutes;
    chatSession.totalCoinsSpent = totalCoinsNeeded;
    chatSession.status = 'closed';
    await chatSession.save();

    // Save user with coin adjustment (if any)
    try {
      await user.save();
      if (coinsToAdjust > 0) {
        console.log(`✅ Additional ${coinsToAdjust} coins debited for extended chat. Balance: ${originalCoins} → ${finalCoins}`);
      } else if (coinsToAdjust < 0) {
        console.log(`✅ Refunded ${Math.abs(coinsToAdjust)} coins for shorter chat. Balance: ${originalCoins} → ${finalCoins}`);
      } else {
        console.log(`✅ Chat ended. No coin adjustment needed (already deducted). Balance: ${user.coins}`);
      }
    } catch (saveError) {
      console.error('Error saving user after coin adjustment:', saveError);
      return res.status(500).json({
        success: false,
        message: 'Error updating user balance',
        error: saveError.message,
      });
    }

    // Emit coin update to user via Socket.IO
    try {
      const updateMessage = coinsToAdjust > 0 
        ? `Chat session ended. Additional ${coinsToAdjust} coins deducted.`
        : coinsToAdjust < 0
        ? `Chat session ended. ${Math.abs(coinsToAdjust)} coins refunded.`
        : `Chat session ended. No additional charges.`;

      emitToUser(user._id.toString(), 'coinUpdate', {
        coins: user.coins,
        debited: coinsToAdjust > 0 ? coinsToAdjust : 0,
        refunded: coinsToAdjust < 0 ? Math.abs(coinsToAdjust) : 0,
        previousBalance: originalCoins,
        sessionId: chatSession._id.toString(),
        message: updateMessage,
      });
    } catch (emitError) {
      console.error('Error emitting coin update:', emitError);
      // Don't fail the request if emit fails
    }

    // Emit chat ended to both parties
    const endData = {
      sessionId: chatSession._id,
      status: chatSession.status,
      totalTimeInMinutes: chatSession.totalTimeInMinutes,
      totalCoinsSpent: chatSession.totalCoinsSpent,
      endTime: chatSession.endTime,
    };

    try {
      emitToUser(userIdToDebit.toString(), 'chatEnded', endData);
      if (chatSession.adminId) {
        const adminIdToNotify = chatSession.adminId._id || chatSession.adminId;
        emitToAdmin(adminIdToNotify.toString(), 'chatEnded', endData);
      }
    } catch (emitError) {
      console.error('Error emitting chat ended event:', emitError);
      // Don't fail the request if emit fails
    }

    res.status(200).json({
      success: true,
      message: 'Chat session ended successfully',
      session: {
        id: chatSession._id,
        status: chatSession.status,
        totalTimeInMinutes: chatSession.totalTimeInMinutes,
        totalCoinsSpent: chatSession.totalCoinsSpent,
        endTime: chatSession.endTime,
        startTime: chatSession.startTime,
      },
      coins: {
        totalSpent: totalCoinsNeeded,
        alreadyDeducted: alreadyDeducted,
        adjustment: coinsToAdjust,
        debited: coinsToAdjust > 0 ? coinsToAdjust : 0,
        refunded: coinsToAdjust < 0 ? Math.abs(coinsToAdjust) : 0,
        previousBalance: originalCoins,
        newBalance: user.coins,
      },
      duration: {
        minutes: totalMinutes,
        display: `${totalMinutes} ${totalMinutes === 1 ? 'minute' : 'minutes'}`,
      },
    });
  } catch (error) {
    console.error('End chat error:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({
      success: false,
      message: 'Server error ending chat',
      error: process.env.NODE_ENV === 'development' ? error.message : 'An error occurred while ending the chat session',
      ...(process.env.NODE_ENV === 'development' && { stack: error.stack }),
    });
  }
};

// @desc    Get pending chat requests (for admins)
// @route   GET /api/chat/pending
// @access  Private (Admin)
exports.getPendingChats = async (req, res) => {
  try {
    const pendingSessions = await ChatSession.find({ status: 'pending' })
      .populate('userId', 'name email coins')
      .sort({ createdAt: -1 });

    // Format sessions with calculated values
    const formattedSessions = pendingSessions.map((session) => {
      const sessionObj = session.toObject();
      // Include requested duration and coins if available
      if (session.requestedDuration) {
        sessionObj.requestedDuration = session.requestedDuration;
        sessionObj.requestedCoins = session.requestedCoins || session.requestedDuration * COINS_PER_MINUTE;
      }
      return sessionObj;
    });

    res.status(200).json({
      success: true,
      count: formattedSessions.length,
      sessions: formattedSessions,
    });
  } catch (error) {
    console.error('Get pending chats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching pending chats',
      error: error.message,
    });
  }
};

// @desc    Get user's chat sessions
// @route   GET /api/chat/sessions
// @access  Private (User)
exports.getUserSessions = async (req, res) => {
  try {
    const userId = req.user._id;

    const sessions = await ChatSession.find({ userId })
      .populate('adminId', 'adminName')
      .sort({ createdAt: -1 })
      .limit(50);

    res.status(200).json({
      success: true,
      count: sessions.length,
      sessions,
    });
  } catch (error) {
    console.error('Get user sessions error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching chat sessions',
      error: error.message,
    });
  }
};

// @desc    Get chat messages for a session
// @route   GET /api/chat/messages/:sessionId
// @access  Private (User or Admin)
exports.getChatMessages = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const userId = req.user?._id?.toString();
    const adminId = req.admin?._id?.toString();

    // Find the chat session
    const chatSession = await ChatSession.findById(sessionId);

    if (!chatSession) {
      return res.status(404).json({
        success: false,
        message: 'Chat session not found',
      });
    }

    // Verify authorization
    const sessionUserId = chatSession.userId._id ? chatSession.userId._id.toString() : chatSession.userId.toString();
    const sessionAdminId = chatSession.adminId?._id ? chatSession.adminId._id.toString() : chatSession.adminId?.toString();

    if (userId && sessionUserId !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this chat',
      });
    }

    if (adminId && chatSession.adminId && sessionAdminId !== adminId) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this chat',
      });
    }

    // Get messages
    const messages = await ChatMessage.find({ sessionId })
      .sort({ createdAt: 1 });

    res.status(200).json({
      success: true,
      count: messages.length,
      messages,
    });
  } catch (error) {
    console.error('Get chat messages error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching messages',
      error: error.message,
    });
  }
};;
