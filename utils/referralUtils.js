const rewardConfig = require('../config/rewardConfig');

const normalizeReferralCode = (code = '') =>
  String(code || '')
    .trim()
    .toUpperCase();

const enforceHistoryLimit = (collection, limit) => {
  if (!Array.isArray(collection) || !Number.isFinite(limit) || limit <= 0) {
    return;
  }

  if (collection.length > limit) {
    collection.splice(0, collection.length - limit);
  }
};

const buildReferralShareLink = (code) => {
  if (!code) {
    return null;
  }

  const base = rewardConfig.referral.shareBaseUrl;
  const route = rewardConfig.referral.signupRoute || '/register';

  return `${base}${route}?ref=${normalizeReferralCode(code)}`;
};

const buildReferralShareMessage = (code) => {
  if (!code) {
    return null;
  }

  const refereeBonus = rewardConfig.referral.refereeBonus;
  return `Join me on MyLearnHub! Use my referral code ${normalizeReferralCode(
    code
  )} to instantly earn ${refereeBonus} coins when you sign up.`;
};

const buildReferralSharePayload = (code) => {
  if (!code) {
    return {
      code: null,
      link: null,
      message: null,
    };
  }

  return {
    code: normalizeReferralCode(code),
    link: buildReferralShareLink(code),
    message: buildReferralShareMessage(code),
  };
};

module.exports = {
  normalizeReferralCode,
  enforceHistoryLimit,
  buildReferralShareLink,
  buildReferralShareMessage,
  buildReferralSharePayload,
};


