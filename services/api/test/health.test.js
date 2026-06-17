const assert = require('node:assert/strict');
const test = require('node:test');
const { getHealthStatus } = require('../src/server');

test('getHealthStatus returns API health', () => {
  assert.deepEqual(getHealthStatus(), { status: 'ok', service: 'api' });
});
