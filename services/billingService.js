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

          // Calculate time since last billing (or start time)
          const lastBillingTime = session.lastBillingTime || session.startTime;
          const now = new Date();
          const timeSinceLastBilling = now - lastBillingTime;

          // Only bill if at least 60 seconds have passed
          if (timeSinceLastBilling < BILLING_INTERVAL_SECONDS * 1000) {
            continue;
          }

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
                sessionId: session._id,
                message: 'Chat session ended due to insufficient coins',
                coinsRemaining: user.coins,
              });

              io.to(userSocketId).emit('coinUpdate', {
                coins: user.coins,
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
              sessionId: session._id,
            });
          }

          console.log(`💸 Debited ${coinsToDebit} coins from user ${user._id} for session ${session._id}`);
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


