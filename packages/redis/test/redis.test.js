const assert = require('node:assert/strict');
const test = require('node:test');
const { createRedisClient, getRedisClient } = require('../src');

test('createRedisClient creates a Redis client with environment defaults', () => {
  const redis = createRedisClient({
    logger: {
      error: () => {}
    }
  });

  assert.equal(typeof redis.get, 'function');
  assert.equal(typeof redis.hset, 'function');
  assert.equal(typeof redis.disconnect, 'function');

  redis.disconnect();
});

test('getRedisClient reuses the same client instance', () => {
  const logger = {
    error: () => {}
  };
  const firstClient = getRedisClient({ logger });
  const secondClient = getRedisClient({ logger });

  assert.equal(firstClient, secondClient);

  firstClient.disconnect();
});
