const assert = require('node:assert/strict');
const test = require('node:test');
const { getHealthStatus } = require('../src/worker');

test('getHealthStatus returns worker health', () => {
  assert.deepEqual(getHealthStatus(), { status: 'ok', service: 'worker' });
});
