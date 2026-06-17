const assert = require('node:assert/strict');
const test = require('node:test');
const { getHealthStatus } = require('../src/server');

test('getHealthStatus returns stats health', () => {
  assert.deepEqual(getHealthStatus(), { status: 'ok', service: 'stats' });
});
