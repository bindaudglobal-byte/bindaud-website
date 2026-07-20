require('dotenv').config({ path: require('path').resolve(__dirname, '..', '.env') });

const getEnv = (key, fallback = undefined) => {
  const value = process.env[key];
  if (value === undefined || value === null || value === '') {
    return fallback;
  }

  return value;
};

const getNumber = (key, fallback) => {
  const value = Number(getEnv(key, fallback));
  return Number.isFinite(value) ? value : fallback;
};

const getBoolean = (key, fallback = false) => {
  const value = getEnv(key, fallback);
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') {
    return ['1', 'true', 'yes', 'on'].includes(value.toLowerCase());
  }
  return Boolean(value);
};

const getSessionSecret = () => getEnv('SESSION_SECRET') || getEnv('COOKIE_SECRET') || 'change-me-session-secret';
const getRateLimitMax = () => getNumber('RATE_LIMIT_MAX', 200);
const getRateLimitWindowMs = () => getNumber('RATE_LIMIT_WINDOW_MS', 15 * 60 * 1000);
const getJwtSecret = () => getEnv('JWT_SECRET') || 'super-secret';
const getClientUrl = () => getEnv('CLIENT_URL') || 'http://localhost:3000';
const getMongoUri = () => getEnv('MONGODB_URI') || 'mongodb://127.0.0.1:27017/bindaud';
const getPort = () => getNumber('PORT', 5000);

module.exports = {
  getEnv,
  getNumber,
  getBoolean,
  getSessionSecret,
  getRateLimitMax,
  getRateLimitWindowMs,
  getJwtSecret,
  getClientUrl,
  getMongoUri,
  getPort,
};
