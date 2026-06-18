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

test('createLogger routes warn, error, and debug log levels', () => {
  const originalLogLevel = process.env.LOG_LEVEL;
  process.env.LOG_LEVEL = 'debug';
  const lines = [];
  const logger = createLogger('test-service', {
    output: {
      log: (line) => lines.push(['log', JSON.parse(line)]),
      warn: (line) => lines.push(['warn', JSON.parse(line)]),
      error: (line) => lines.push(['error', JSON.parse(line)])
    }
  });

  logger.warn('slow', { route: '/submit' });
  logger.error('failed', new Error('boom'));
  logger.debug('payload', { limit: 10 });

  assert.equal(lines[0][0], 'warn');
  assert.equal(lines[0][1].route, '/submit');
  assert.equal(lines[1][0], 'error');
  assert.equal(lines[1][1].error.message, 'boom');
  assert.equal(lines[2][0], 'log');
  assert.equal(lines[2][1].level, 'debug');

  if (originalLogLevel === undefined) {
    delete process.env.LOG_LEVEL;
  } else {
    process.env.LOG_LEVEL = originalLogLevel;
  }
});

test('debug logging is skipped unless LOG_LEVEL is debug', () => {
  const originalLogLevel = process.env.LOG_LEVEL;
  delete process.env.LOG_LEVEL;
  const lines = [];
  const logger = createLogger('test-service', {
    output: {
      log: (line) => lines.push(line),
      warn: (line) => lines.push(line),
      error: (line) => lines.push(line)
    }
  });

  logger.debug('hidden');

  assert.equal(lines.length, 0);

  if (originalLogLevel === undefined) {
    delete process.env.LOG_LEVEL;
  } else {
    process.env.LOG_LEVEL = originalLogLevel;
  }
});
