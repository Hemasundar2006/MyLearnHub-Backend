const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const profileSchema = new mongoose.Schema(
  {
    mobileNumber: {
      type: String,
      trim: true,
      match: [
        /^\+?[0-9]{10,15}$/,
        'Please provide a valid mobile number with 10-15 digits',
      ],
    },
    college: {
      type: String,
      trim: true,
      maxlength: 120,
    },
    currentYear: {
      type: String,
      trim: true,
      maxlength: 40,
    },
    graduationYear: {
      type: Number,
      min: 1950,
      max: 2100,
    },
    skills: {
      type: [String],
      default: [],
      validate: {
        validator: (skills = []) => skills.length <= 25,
        message: 'You can add up to 25 skills',
      },
    },
    bio: {
      type: String,
      trim: true,
      maxlength: 500,
    },
    location: {
      type: String,
      trim: true,
      maxlength: 120,
    },
    website: {
      type: String,
      trim: true,
      maxlength: 120,
    },
    github: {
      type: String,
      trim: true,
      maxlength: 120,
    },
    linkedin: {
      type: String,
      trim: true,
      maxlength: 120,
    },
    interests: {
      type: [String],
      default: [],
      validate: {
        validator: (interests = []) => interests.length <= 25,
        message: 'You can add up to 25 interests',
      },
    },
    experienceLevel: {
      type: String,
      trim: true,
      maxlength: 60,
    },
  },
  { _id: false }
);

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please provide a name'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Please provide an email'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
        'Please provide a valid email',
      ],
    },
    password: {
      type: String,
      required: [true, 'Please provide a password'],
      minlength: 6,
      select: false,
    },
    avatar: {
      type: String,
      default: 'https://ui-avatars.com/api/?name=User&background=random',
    },
    role: {
      type: String,
      enum: ['user', 'admin'],
      default: 'user',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    coins: {
      type: Number,
      default: 0,
      min: 0,
    },
    coinTransactions: [
      {
        amount: {
          type: Number,
          required: true,
        },
        type: {
          type: String,
          enum: ['earned', 'spent', 'bonus', 'penalty'],
          required: true,
        },
        reason: {
          type: String,
          required: true,
        },
        relatedThought: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Thought',
        },
        metadata: {
          type: mongoose.Schema.Types.Mixed,
        },
        timestamp: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    referralCode: {
      type: String,
      unique: true,
      sparse: true,
      uppercase: true,
      trim: true,
    },
    referredBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },
    referralStats: {
      totalShares: { type: Number, default: 0 },
      totalClicks: { type: Number, default: 0 },
      successfulReferrals: { type: Number, default: 0 },
      totalCoinsEarned: { type: Number, default: 0 },
      lastReferralAt: { type: Date },
    },
    referralHistory: [
      {
        referredUser: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
        referredEmail: String,
        referredName: String,
        status: {
          type: String,
          enum: ['completed', 'pending', 'failed'],
          default: 'completed',
        },
        rewardForReferrer: Number,
        rewardForInvitee: Number,
        note: String,
        createdAt: {
          type: Date,
          default: Date.now,
        },
        completedAt: Date,
      },
    ],
    profile: {
      type: profileSchema,
      default: {},
    },
    profileCompletionRewardClaimed: {
      type: Boolean,
      default: false,
    },
    profileCompletionRewardClaimedAt: {
      type: Date,
    },
    badges: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Badge',
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    next();
  }

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Compare password method
userSchema.methods.comparePassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Generate avatar URL based on name
userSchema.pre('save', function (next) {
  if (this.isModified('name') && !this.avatar) {
    this.avatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(
      this.name
    )}&background=random`;
  }
  next();
});

userSchema.pre('save', async function (next) {
  if (this.referralCode) {
    return next();
  }

  try {
    this.referralCode = await this.constructor.generateUniqueReferralCode(
      this.name
    );
    next();
  } catch (error) {
    next(error);
  }
});

userSchema.statics.generateUniqueReferralCode = async function (name = '') {
  const base =
    (name && name.replace(/[^a-zA-Z0-9]/g, '').slice(0, 4).toUpperCase()) ||
    'MLH';

  let code;
  let exists = true;
  let attempts = 0;

  while (exists) {
    const random = crypto.randomBytes(3).toString('hex').toUpperCase();
    code = `${base}${random}`;
    attempts += 1;

    if (attempts > 10) {
      code = `MLH${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
    }

    exists = await this.findOne({ referralCode: code });
  }

  return code;
};

module.exports = mongoose.model('User', userSchema);

