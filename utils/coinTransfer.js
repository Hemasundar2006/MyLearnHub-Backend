const User = require('../models/User');

/**
 * Transfer coins from admin to a student
 * @param {string} studentId - The student's user ID
 * @param {number} amount - Amount of coins to transfer
 * @param {string} reason - Reason for the transfer
 * @param {string} relatedThoughtId - Optional related thought ID
 * @param {string} relatedDoubtId - Optional related doubt ID
 * @returns {Promise<Object>} - Result of the transfer
 */
const transferCoinsFromAdmin = async (studentId, amount, reason, relatedThoughtId = null, relatedDoubtId = null) => {
  try {
    // Find admin user
    const admin = await User.findOne({ role: 'admin' });
    if (!admin) {
      throw new Error('Admin user not found');
    }

    // Check if admin has enough coins
    if (admin.coins < amount) {
      throw new Error('Insufficient admin coins');
    }

    // Find student user
    const student = await User.findById(studentId);
    if (!student) {
      throw new Error('Student user not found');
    }

    // Start transaction
    const session = await User.startSession();
    session.startTransaction();

    try {
      // Deduct coins from admin
      admin.coins -= amount;
      admin.coinTransactions.push({
        amount: -amount, // Negative amount for deduction
        type: 'spent',
        reason: `Transferred to student: ${reason}`,
        timestamp: new Date(),
      });
      await admin.save({ session });

      // Add coins to student
      student.coins += amount;
      student.coinTransactions.push({
        amount: amount,
        type: 'earned',
        reason: reason,
        relatedThought: relatedThoughtId,
        timestamp: new Date(),
      });
      await student.save({ session });

      // Commit transaction
      await session.commitTransaction();

      return {
        success: true,
        adminNewBalance: admin.coins,
        studentNewBalance: student.coins,
        amount: amount,
      };
    } catch (error) {
      // Rollback transaction on error
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  } catch (error) {
    console.error('Coin transfer error:', error);
    throw error;
  }
};

/**
 * Get admin coin balance
 * @returns {Promise<number>} - Admin's current coin balance
 */
const getAdminCoinBalance = async () => {
  try {
    const admin = await User.findOne({ role: 'admin' }).select('coins');
    return admin ? admin.coins : 0;
  } catch (error) {
    console.error('Get admin coin balance error:', error);
    return 0;
  }
};

module.exports = {
  transferCoinsFromAdmin,
  getAdminCoinBalance,
};
