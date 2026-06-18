const assert = require('node:assert/strict');
const test = require('node:test');
const { createLogger } = require('@microservices-monitoring/logger');
const {
  createJobRepository,
  createQueueRepository,
  createStatsRepository
} = require('@microservices-monitoring/redis');

function createMultiStub(calls) {
  const chain = {
    hset: (...args) => {
      calls.push(['hset', ...args]);
      return chain;
    },
    rpush: (...args) => {
      calls.push(['rpush', ...args]);
      return chain;
    },
    incr: (...args) => {
      calls.push(['incr', ...args]);
      return chain;
    },
    incrbyfloat: (...args) => {
      calls.push(['incrbyfloat', ...args]);
      return chain;
    },
    exec: async () => {
      calls.push(['exec']);
    }
  };

  return chain;
}

test('shared logger writes info, warn, error, debug, and error metadata', () => {
  const lines = [];
  const originalLogLevel = process.env.LOG_LEVEL;
  process.env.LOG_LEVEL = 'debug';
  const output = {
    log: (line) => lines.push(['log', JSON.parse(line)]),
    warn: (line) => lines.push(['warn', JSON.parse(line)]),
    error: (line) => lines.push(['error', JSON.parse(line)])
  };
  const logger = createLogger('api-test', { output });
  const error = new Error('boom');

  logger.info('started');
  logger.warn('careful', { requestId: 'req-1' });
  logger.error('failed', error);
  logger.debug('details', { enabled: true });

  assert.equal(lines[0][0], 'log');
  assert.equal(lines[1][0], 'warn');
  assert.equal(lines[2][0], 'error');
  assert.equal(lines[2][1].error.message, 'boom');
  assert.equal(lines[3][1].enabled, true);

  if (originalLogLevel === undefined) {
    delete process.env.LOG_LEVEL;
  } else {
    process.env.LOG_LEVEL = originalLogLevel;
  }
});

test('shared Redis repositories cover job lifecycle, queue, and empty stats edges', async () => {
  const calls = [];
  const jobRepository = createJobRepository({
    hgetall: async () => ({}),
    hset: async (...args) => calls.push(['hset-direct', ...args]),
    multi: () => createMultiStub(calls)
  });

  assert.equal(await jobRepository.findById('missing'), undefined);

  await jobRepository.createQueuedJob(
    { id: 'job-1', type: 'prime', status: 'queued', payload: { limit: 10 } },
    'jobs:queue'
  );
  await jobRepository.markProcessing('job-1', 'worker-1');
  await jobRepository.markCompleted('job-1', { count: 4 }, 0.25);
  await jobRepository.markFailed('job-2', 'bad limit');

  assert.ok(calls.some((call) => call[0] === 'rpush'));
  assert.ok(calls.some((call) => call[0] === 'hset-direct'));
  assert.ok(calls.some((call) => call.includes('stats:jobs_completed')));
  assert.ok(calls.some((call) => call.includes('stats:job_errors')));

  const queueRepository = createQueueRepository(
    {
      blpop: async () => undefined,
      llen: async () => 0
    },
    'jobs:queue'
  );

  assert.equal(await queueRepository.popJob(1), undefined);
  assert.equal(await queueRepository.getLength(), 0);

  const statsRepository = createStatsRepository(
    { get: async () => undefined },
    { getLength: async () => 0 }
  );

  assert.deepEqual(await statsRepository.getJobStats(), {
    totalJobsSubmitted: 0,
    totalJobsCompleted: 0,
    totalJobErrors: 0,
    queueLength: 0,
    avgProcessingTimeSeconds: 0
  });
});
