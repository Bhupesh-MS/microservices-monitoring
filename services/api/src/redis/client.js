const Redis = require('ioredis');

const redis = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: Number(process.env.REDIS_PORT || 6379),
  maxRetriesPerRequest: null
});

redis.on('error', (error) => {
  console.error('Redis connection error:', error.message);
});

module.exports = redis;
