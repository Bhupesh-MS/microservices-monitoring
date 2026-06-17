const assert = require('node:assert/strict');
const test = require('node:test');
const { processJob } = require('../src/utils/jobProcessor');

test('processJob rejects unsupported job types', () => {
  assert.throws(() => processJob('unknown'), /Unsupported job type/);
});
