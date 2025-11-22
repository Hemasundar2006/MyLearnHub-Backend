const cron = require('node-cron');
const ChatSession = require('../models/ChatSession');
const User = require('../models/User');
const { activeConnections } = require('../socket/chatHandler');

// Constants
const COINS_PER_MINUTE = 10;
const BILLING_INTERVAL_SECONDS = 60; // Bill every 60 seconds (1 minute)

// Billing service to debit coins from users for active chat sessions
const startBillingService = (io) => {
  console.log('💰 Billing service started - Running every 60 seconds');

  // Run every 60 seconds
  cron.schedule('*/1 * * * *', async () => {
    try {
      // Find all active chat sessions
      const activeSessions = await ChatSession.find({
        status: 'active',
      }).populate('userId', 'coins');

      if (activeSessions.length === 0) {
        return; // No active sessions
      }

      console.log(`📊 Processing billing for ${activeSessions.length} active session(s)`);

      for (const session of activeSessions) {
        try {
          const user = session.userId;
          if (!user) {
            console.error(`User not found for session ${session._id}`);
            continue;
          }

          const now = new Date();
          const startTime = session.startTime;

          // Check if requested duration has been reached (auto-end)
          if (session.requestedDuration && startTime) {
            const elapsedMinutes = Math.floor((now - startTime) / (1000 * 60));
            
            if (elapsedMinutes >= session.requestedDuration) {
              // Requested duration completed - auto-end the chat
              console.log(`⏰ Requested duration (${session.requestedDuration} minutes) completed for session ${session._id}. Auto-ending...`);
              
              // Calculate final time and coins
              const endTime = new Date(startTime.getTime() + (session.requestedDuration * 60 * 1000));
              const totalCoinsSpent = session.requestedDuration * COINS_PER_MINUTE;

              // Update session
              session.status = 'closed';
              session.endTime = endTime;
              session.totalTimeInMinutes = session.requestedDuration;
              session.totalCoinsSpent = totalCoinsSpent;
              await session.save();

              // Emit auto-end event to user and admin
              const userSocketId = activeConnections.users.get(user._id.toString());
              if (userSocketId && io) {
                io.to(userSocketId).emit('chatAutoEnded', {
                  sessionId: session._id.toString(),
                  message: `Chat session completed. Requested duration (${session.requestedDuration} minutes) reached.`,
                  totalTimeInMinutes: session.requestedDuration,
                  totalCoinsSpent: totalCoinsSpent,
                  reason: 'duration_completed',
                });

                io.to(userSocketId).emit('chatEnded', {
                  sessionId: session._id.toString(),
                  status: 'closed',
                  totalTimeInMinutes: session.requestedDuration,
                  totalCoinsSpent: totalCoinsSpent,
                  endTime: endTime,
                  reason: 'duration_completed',
                });
              }

              // Notify admin
              if (session.adminId) {
                const adminSocketId = activeConnections.admins.get(session.adminId.toString());
                if (adminSocketId && io) {
                  io.to(adminSocketId).emit('chatEnded', {
                    sessionId: session._id.toString(),
                    status: 'closed',
                    message: `Chat session auto-ended. Requested duration (${session.requestedDuration} minutes) completed.`,
                    totalTimeInMinutes: session.requestedDuration,
                    totalCoinsSpent: totalCoinsSpent,
                    reason: 'duration_completed',
                  });
                }
              }

              continue; // Skip billing for this session
            }
          }

          // Calculate time since last billing (or start time)
          const lastBillingTime = session.lastBillingTime || session.startTime;
          const timeSinceLastBilling = now - lastBillingTime;

          // Only bill if at least 60 seconds have passed
          if (timeSinceLastBilling < BILLING_INTERVAL_SECONDS * 1000) {
            continue;
          }

          // Check if coins were already deducted on acceptance
          // If requestedCoins exists, coins were deducted upfront - only track time for auto-end
          const coinsAlreadyDeducted = session.requestedCoins && session.requestedCoins > 0;
          
          if (coinsAlreadyDeducted) {
            // Coins already deducted on acceptance - just track time for auto-end
            // Update last billing time to track progress
            session.lastBillingTime = now;
            await session.save();
            continue; // Skip billing, coins already paid
          }

          // Coins not deducted upfront - use per-minute billing
          // Calculate minutes to bill (round up)
          const minutesToBill = Math.ceil(timeSinceLastBilling / (1000 * 60));
          const coinsToDebit = minutesToBill * COINS_PER_MINUTE;

          // Check if user has enough coins
          if (user.coins < coinsToDebit) {
            // User doesn't have enough coins - terminate session
            console.log(`⚠️ Insufficient coins for session ${session._id}. Terminating...`);

            // Calculate actual time and coins used
            const actualMinutes = Math.floor(user.coins / COINS_PER_MINUTE);
            const actualCoinsUsed = actualMinutes * COINS_PER_MINUTE;

            // Update session
            session.status = 'timeout';
            session.endTime = now;
            session.totalTimeInMinutes = actualMinutes;
            session.totalCoinsSpent = actualCoinsUsed;
            await session.save();

            // Debit remaining coins
            if (actualCoinsUsed > 0) {
              user.coins = Math.max(0, user.coins - actualCoinsUsed);

              // Add transaction record
              user.coinTransactions.push({
                amount: -actualCoinsUsed,
                type: 'spent',
                reason: `Chat session timeout (${actualMinutes} minutes) - Insufficient coins`,
                metadata: {
                  sessionId: session._id,
                  totalMinutes: actualMinutes,
                  reason: 'timeout',
                },
                timestamp: now,
              });

              await user.save();
            }

            // Notify user via Socket.IO
            const userSocketId = activeConnections.users.get(user._id.toString());
            if (userSocketId && io) {
              io.to(userSocketId).emit('chatTimeout', {
                sessionId: session._id.toString(),
                message: 'Chat session ended due to insufficient coins',
                coinsRemaining: user.coins,
                totalCoinsSpent: actualCoinsUsed,
                totalMinutes: actualMinutes,
              });

              io.to(userSocketId).emit('coinUpdate', {
                coins: user.coins,
                debited: actualCoinsUsed,
                sessionId: session._id.toString(),
                message: 'Chat session ended due to insufficient coins',
              });
            }

            // Notify admin if connected
            if (session.adminId) {
              const adminSocketId = activeConnections.admins.get(session.adminId.toString());
              if (adminSocketId && io) {
                io.to(adminSocketId).emit('chatEnded', {
                  sessionId: session._id,
                  status: 'timeout',
                  message: 'Chat session ended due to user insufficient coins',
                });
              }
            }

            continue;
          }

          // Store original coins for logging
          const originalCoins = user.coins;

          // Debit coins
          user.coins = user.coins - coinsToDebit;

          // Add transaction record
          user.coinTransactions.push({
            amount: -coinsToDebit,
            type: 'spent',
            reason: `Chat session billing (${minutesToBill} minute(s))`,
            metadata: {
              sessionId: session._id,
              minutes: minutesToBill,
            },
            timestamp: now,
          });

          // Save user with coin deduction
          try {
            await user.save();
            
            // Update session last billing time
            session.lastBillingTime = now;
            await session.save();

            // Notify user of coin update via Socket.IO
            const userSocketId = activeConnections.users.get(user._id.toString());
            if (userSocketId && io) {
              io.to(userSocketId).emit('coinUpdate', {
                coins: user.coins,
                debited: coinsToDebit,
                sessionId: session._id.toString(),
                previousBalance: originalCoins,
                message: `${coinsToDebit} coins deducted for chat session`,
              });
            }

            console.log(`💸 Debited ${coinsToDebit} coins from user ${user._id} for session ${session._id}. Balance: ${originalCoins} → ${user.coins}`);
          } catch (saveError) {
            console.error(`❌ Error saving user coins for session ${session._id}:`, saveError);
            // Continue to next session even if this one fails
          }
        } catch (error) {
          console.error(`Error processing billing for session ${session._id}:`, error);
        }
      }
    } catch (error) {
      console.error('Billing service error:', error);
    }
  });
};

module.exports = { startBillingService };


