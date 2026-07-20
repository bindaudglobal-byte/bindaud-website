const test = require('node:test');
const assert = require('node:assert/strict');
const { getRateLimitMax, getRateLimitWindowMs, getSessionSecret } = require('../config/env');

test('uses safe defaults when session and rate limit env vars are not set', () => {
  assert.equal(getRateLimitMax(), 200);
  assert.equal(getRateLimitWindowMs(), 15 * 60 * 1000);
  assert.equal(getSessionSecret(), 'change-me-session-secret');
});
