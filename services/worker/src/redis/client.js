const Redis = require('ioredis');

function createRedisClient() {
  const redis = new Redis({
    host: process.env.REDIS_HOST || 'localhost',
    port: Number(process.env.REDIS_PORT || 6379),
    maxRetriesPerRequest: null
  });

  redis.on('error', (error) => {
    console.error('Redis connection error:', error.message);
  });

  return redis;
}

module.exports = { createRedisClient };
