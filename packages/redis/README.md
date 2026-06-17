# Redis Package

Reusable Redis client factory for services that need queue, job status, or stats storage.

## Usage

```js
const { createJobRepository, getRedisClient } = require('@microservices-monitoring/redis');

const redis = getRedisClient({ logger });
const jobRepository = createJobRepository(redis);
```

Use `createRedisClient({ logger })` when a service needs a separate connection, such as a blocking Redis consumer.

## Repositories

- `createJobRepository(redis)` manages job records and job lifecycle state.
- `createQueueRepository(redis, queueName)` manages Redis queue operations.
- `createStatsRepository(redis, queueRepository)` reads aggregate job metrics.

## Environment

Values are read from the root `.env` during local development:

- `REDIS_HOST` defaults to `localhost`.
- `REDIS_PORT` defaults to `6379`.

## Tests

From the repository root:

```bash
npm run test:redis
```
