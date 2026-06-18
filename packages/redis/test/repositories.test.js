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

test('job repository returns undefined for missing records', async () => {
  const repository = createJobRepository({
    hgetall: async () => ({})
  });

  assert.equal(await repository.findById('missing'), undefined);
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
      blpop: async () => ['jobs:queue', '{"id":"job-1","type":"prime"}']
    },
    'jobs:queue'
  );

  assert.deepEqual(await repository.popJob(), { id: 'job-1', type: 'prime' });
});

test('job repository marks processing, completed, and failed states', async () => {
  const calls = [];
  const repository = createJobRepository({
    hset: async (...args) => calls.push(['hset-direct', ...args]),
    multi: () => createMultiStub(calls)
  });

  await repository.markProcessing('job-1', 'worker-1');
  await repository.markCompleted('job-1', { count: 4 }, 0.25);
  await repository.markFailed('job-2', 'bad limit');

  assert.deepEqual(calls[0].slice(0, 2), ['hset-direct', 'job:job-1']);
  assert.ok(calls.some((call) => call.includes('stats:jobs_completed')));
  assert.ok(calls.some((call) => call.includes('stats:job_errors')));
});

test('queue repository handles empty pops and returns queue length', async () => {
  const repository = createQueueRepository(
    {
      blpop: async () => undefined,
      llen: async () => 7
    },
    'jobs:queue'
  );

  assert.equal(await repository.popJob(), undefined);
  assert.equal(await repository.getLength(), 7);
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
