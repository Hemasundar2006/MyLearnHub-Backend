const sanitizeRoute = (route = '/register') => {
  if (!route) {
    return '/register';
  }

  return route.startsWith('/') ? route : `/${route}`;
};

const parseNumber = (value, fallback) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const REFERRER_BONUS = parseNumber(process.env.REFERRER_BONUS_COINS, 50);
const REFEREE_BONUS = parseNumber(process.env.REFEREE_BONUS_COINS, 25);
const COIN_HISTORY_LIMIT = parseNumber(process.env.COIN_HISTORY_LIMIT, 200);
const REFERRAL_HISTORY_LIMIT = parseNumber(process.env.REFERRAL_HISTORY_LIMIT, 100);

module.exports = {
  referral: {
    referrerBonus: REFERRER_BONUS,
    refereeBonus: REFEREE_BONUS,
    shareBaseUrl: (process.env.FRONTEND_URL || 'https://mylearnhub.com').replace(
      /\/$/,
      ''
    ),
    signupRoute: sanitizeRoute(process.env.REFERRAL_SIGNUP_ROUTE),
    historyLimit: REFERRAL_HISTORY_LIMIT,
  },
  coins: {
    transactionHistoryLimit: COIN_HISTORY_LIMIT,
  },
};


