const assert = require('node:assert/strict');
const test = require('node:test');
const { createLogger } = require('../src');

test('createLogger writes structured log lines', () => {
  const lines = [];
  const logger = createLogger('test-service', {
    output: {
      log: (line) => lines.push(line),
      warn: (line) => lines.push(line),
      error: (line) => lines.push(line)
    }
  });

  logger.info('started', { port: 3000 });

  assert.equal(lines.length, 1);
  const entry = JSON.parse(lines[0]);
  assert.equal(entry.level, 'info');
  assert.equal(entry.service, 'test-service');
  assert.equal(entry.message, 'started');
  assert.equal(entry.port, 3000);
});
