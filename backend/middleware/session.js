const crypto = require('crypto');
const { getSessionSecret } = require('../config/env');

const SESSION_COOKIE_NAME = 'bindaud_session';
const COOKIE_OPTIONS = {
  httpOnly: true,
  sameSite: 'lax',
  secure: process.env.NODE_ENV === 'production',
};

const parseCookies = (cookieHeader = '') => {
  return cookieHeader.split(';').reduce((acc, part) => {
    const [name, ...rest] = part.trim().split('=');
    if (!name) return acc;
    acc[name] = decodeURIComponent(rest.join('='));
    return acc;
  }, {});
};

const encodeBase64 = (value) => Buffer.from(value).toString('base64url');
const decodeBase64 = (value) => Buffer.from(value, 'base64url').toString('utf8');

const sign = (payload, secret) => {
  const signature = crypto.createHmac('sha256', secret).update(payload).digest('hex');
  return `${payload}.${signature}`;
};

const verify = (value, secret) => {
  const separatorIndex = value.lastIndexOf('.');
  if (separatorIndex <= 0) return null;

  const payload = value.slice(0, separatorIndex);
  const expected = value.slice(separatorIndex + 1);
  const actual = crypto.createHmac('sha256', secret).update(payload).digest('hex');
  return expected === actual ? payload : null;
};

const sessionMiddleware = (req, res, next) => {
  const secret = getSessionSecret();
  req.session = {};

  if (!secret || secret === 'change-me-session-secret') {
    req.session.isEnabled = false;
    return next();
  }

  const cookies = parseCookies(req.headers.cookie || '');
  const signedSession = cookies[SESSION_COOKIE_NAME];

  if (signedSession) {
    const payload = verify(signedSession, secret);
    if (payload) {
      try {
        req.session = JSON.parse(decodeBase64(payload));
      } catch (error) {
        req.session = {};
      }
    }
  }

  req.session.isEnabled = true;
  req.session.id = req.session.id || crypto.randomBytes(16).toString('hex');
  req.session.createdAt = req.session.createdAt || new Date().toISOString();

  req.session.save = () => {
    const payload = encodeBase64(JSON.stringify(req.session));
    res.cookie(SESSION_COOKIE_NAME, sign(payload, secret), {
      ...COOKIE_OPTIONS,
      maxAge: 1000 * 60 * 60 * 24 * 7,
    });
  };

  req.session.destroy = () => {
    res.clearCookie(SESSION_COOKIE_NAME, COOKIE_OPTIONS);
    req.session = {};
  };

  if (!req.session._initialized) {
    req.session._initialized = true;
    req.session.save();
  }

  next();
};

module.exports = sessionMiddleware;
