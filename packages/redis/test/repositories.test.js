const assert = require('node:assert/strict');
const test = require('node:test');
const { createJobRepository, createQueueRepository, createStatsRepository } = require('../src');

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

test('job repository maps stored job records', async () => {
  const repository = createJobRepository({
    hgetall: async () => ({
      id: 'job-1',
      payload: '{"type":"prime"}',
      result: '{"count":10}',
      error: ''
    })
  });

  assert.deepEqual(await repository.findById('job-1'), {
    id: 'job-1',
    payload: { type: 'prime' },
    result: { count: 10 },
    error: undefined
  });
});

test('job repository creates queued jobs and increments submitted counter', async () => {
  const calls = [];
  const repository = createJobRepository({
    multi: () => createMultiStub(calls)
  });

  await repository.createQueuedJob(
    {
      id: 'job-1',
      type: 'prime',
      status: 'queued',
      payload: { type: 'prime' }
    },
    'jobs:queue'
  );

  assert.equal(calls.at(-1)[0], 'exec');
  assert.deepEqual(calls[1], [
    'rpush',
    'jobs:queue',
    JSON.stringify({ id: 'job-1', type: 'prime', payload: { type: 'prime' } })
  ]);
  assert.deepEqual(calls[2], ['incr', 'stats:jobs_submitted']);
});

test('queue repository parses blocking pop results', async () => {
  const repository = createQueueRepository(
    {
      blpop: async () => ['jobs:queue', '{"id":"job-1","type":"sort"}']
    },
    'jobs:queue'
  );

  assert.deepEqual(await repository.popJob(), { id: 'job-1', type: 'sort' });
});

test('stats repository calculates aggregate job stats', async () => {
  const values = {
    'stats:jobs_submitted': '10',
    'stats:jobs_completed': '8',
    'stats:job_errors': '2',
    'stats:processing_time_seconds_sum': '20',
    'stats:processing_time_count': '4'
  };
  const repository = createStatsRepository(
    {
      get: async (key) => values[key]
    },
    {
      getLength: async () => 3
    }
  );

  assert.deepEqual(await repository.getJobStats(), {
    totalJobsSubmitted: 10,
    totalJobsCompleted: 8,
    totalJobErrors: 2,
    queueLength: 3,
    avgProcessingTimeSeconds: 5
  });
});
