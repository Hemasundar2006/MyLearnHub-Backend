const User = require('../models/User');
const { generateToken } = require('../middleware/auth');
const { sendRegistrationEmail } = require('../utils/emailService');
const rewardConfig = require('../config/rewardConfig');
const {
  normalizeReferralCode,
  enforceHistoryLimit,
} = require('../utils/referralUtils');

const applyReferralRewards = async ({ referrer, newUser }) => {
  if (!referrer || !newUser) {
    return null;
  }

  const issuedAt = new Date();
  const {
    referrerBonus,
    refereeBonus,
    historyLimit: referralHistoryLimit,
  } = rewardConfig.referral;
  const { transactionHistoryLimit } = rewardConfig.coins;

  referrer.coins += referrerBonus;
  referrer.coinTransactions.push({
    amount: referrerBonus,
    type: 'bonus',
    reason: `Referral bonus for ${newUser.email}`,
    metadata: {
      referredUser: newUser._id,
    },
    timestamp: issuedAt,
  });
  enforceHistoryLimit(referrer.coinTransactions, transactionHistoryLimit);

  referrer.referralStats = referrer.referralStats || {};
  referrer.referralStats.successfulReferrals =
    (referrer.referralStats.successfulReferrals || 0) + 1;
  referrer.referralStats.totalCoinsEarned =
    (referrer.referralStats.totalCoinsEarned || 0) + referrerBonus;
  referrer.referralStats.lastReferralAt = issuedAt;

  referrer.referralHistory = referrer.referralHistory || [];
  referrer.referralHistory.unshift({
    referredUser: newUser._id,
    referredEmail: newUser.email,
    referredName: newUser.name,
    rewardForReferrer: referrerBonus,
    rewardForInvitee: refereeBonus,
    note: 'Referral signup completed',
    completedAt: issuedAt,
  });
  enforceHistoryLimit(referrer.referralHistory, referralHistoryLimit);
  await referrer.save();

  newUser.coins += refereeBonus;
  newUser.coinTransactions.push({
    amount: refereeBonus,
    type: 'bonus',
    reason: `Referral welcome bonus from ${referrer.name}`,
    metadata: {
      referrer: referrer._id,
    },
    timestamp: issuedAt,
  });
  enforceHistoryLimit(newUser.coinTransactions, transactionHistoryLimit);

  newUser.referralStats = newUser.referralStats || {};
  newUser.referralStats.totalCoinsEarned =
    (newUser.referralStats.totalCoinsEarned || 0) + refereeBonus;
  newUser.referralStats.lastReferralAt =
    newUser.referralStats.lastReferralAt || issuedAt;
  await newUser.save();

  return {
    referrerReward: referrerBonus,
    refereeReward: refereeBonus,
  };
};

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res) => {
  try {
    const { name, email, password, referralCode } = req.body;

    // Validation
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields',
      });
    }

    // Check if user exists
    const userExists = await User.findOne({ email });

    if (userExists) {
      return res.status(400).json({
        success: false,
        message: 'User already exists with this email',
      });
    }

    let referrer = null;
    if (referralCode) {
      referrer = await User.findOne({
        referralCode: normalizeReferralCode(referralCode),
      });

      if (!referrer) {
        return res.status(400).json({
          success: false,
          message: 'Invalid or expired referral code',
        });
      }

      if (referrer.email === email) {
        return res.status(400).json({
          success: false,
          message: 'You cannot use your own referral code',
        });
      }
    }

    // Create user
    const user = await User.create({
      name,
      email,
      password,
      role: 'user', // Default role
      ...(referrer && { referredBy: referrer._id }),
    });

    let referralReward = null;
    if (referrer) {
      referralReward = await applyReferralRewards({ referrer, newUser: user });
    }

    // Generate token
    const token = generateToken(user._id);

    // Send registration welcome email (non-blocking - don't wait for it)
    sendRegistrationEmail({
      name: user.name,
      email: user.email,
    })
      .then((result) => {
        if (result.success) {
          console.log('✅ Registration email sent successfully to:', user.email);
        } else {
          console.error('❌ Failed to send registration email:', result.message || result.error);
        }
      })
      .catch((error) => {
        console.error('❌ Error sending registration email:', error.message || error);
      });

    // Return success response immediately (email is sent asynchronously)
    res.status(201).json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        role: user.role,
        coins: user.coins,
        referralCode: user.referralCode,
        referredBy: user.referredBy,
      },
      referralReward,
      message: referralReward
        ? 'Registration successful! Referral rewards have been issued.'
        : 'Registration successful! Welcome email has been sent.',
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during registration',
      error: error.message,
    });
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password',
      });
    }

    // Check for user and include password field
    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
      });
    }

    // Check if password matches
    const isMatch = await user.comparePassword(password);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
      });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Account is deactivated. Please contact support.',
      });
    }

    // Generate token
    const token = generateToken(user._id);

    res.status(200).json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during login',
      error: error.message,
    });
  }
};

// @desc    Get current logged in user
// @route   GET /api/auth/profile
// @access  Private
exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    res.status(200).json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        role: user.role,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching profile',
      error: error.message,
    });
  }
};

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
exports.updateProfile = async (req, res) => {
  try {
    const { name, avatar } = req.body;

    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Update fields
    if (name) user.name = name;
    if (avatar) user.avatar = avatar;

    await user.save();

    res.status(200).json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        role: user.role,
      },
      message: 'Profile updated successfully',
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error updating profile',
      error: error.message,
    });
  }
};

