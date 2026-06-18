const assert = require('node:assert/strict');
const test = require('node:test');
const { createWorkerService } = require('../src/services/workerService');

test('worker service marks prime jobs completed with payload-driven result', async () => {
  const calls = [];
  const service = createWorkerService(undefined, undefined, {
    workerName: 'test-worker',
    jobRepository: {
      markProcessing: async (...args) => calls.push(['markProcessing', ...args]),
      markCompleted: async (...args) => calls.push(['markCompleted', ...args]),
      markFailed: async (...args) => calls.push(['markFailed', ...args])
    },
    queueRepository: {}
  });

  await service.handleJob({ id: 'job-1', type: 'prime', payload: { limit: 10 } });

  assert.deepEqual(calls[0], ['markProcessing', 'job-1', 'test-worker']);
  assert.equal(calls[1][0], 'markCompleted');
  assert.equal(calls[1][1], 'job-1');
  assert.deepEqual(calls[1][2], {
    limit: 10,
    count: 4,
    lastPrime: 7,
    primes: [2, 3, 5, 7]
  });
  assert.equal(typeof calls[1][3], 'number');
});

test('worker service marks invalid jobs failed', async () => {
  const calls = [];
  const service = createWorkerService(undefined, undefined, {
    workerName: 'test-worker',
    jobRepository: {
      markProcessing: async (...args) => calls.push(['markProcessing', ...args]),
      markCompleted: async (...args) => calls.push(['markCompleted', ...args]),
      markFailed: async (...args) => calls.push(['markFailed', ...args])
    },
    queueRepository: {}
  });

  await service.handleJob({ id: 'job-1', type: 'prime', payload: { limit: 1 } });

  assert.equal(calls[1][0], 'markFailed');
  assert.equal(calls[1][1], 'job-1');
  assert.match(calls[1][2], /Prime job limit/);
});

test('worker service consume loop skips empty polls and handles queued jobs', async () => {
  const calls = [];
  const stop = new Error('stop');
  const jobs = [undefined, { id: 'job-1', type: 'prime', payload: { limit: 5 } }, stop];
  const service = createWorkerService(undefined, undefined, {
    workerName: 'test-worker',
    jobRepository: {
      markProcessing: async (...args) => calls.push(['markProcessing', ...args]),
      markCompleted: async (...args) => calls.push(['markCompleted', ...args]),
      markFailed: async (...args) => calls.push(['markFailed', ...args])
    },
    queueRepository: {
      popJob: async () => {
        const next = jobs.shift();

        if (next instanceof Error) {
          throw next;
        }

        return next;
      }
    }
  });

  await assert.rejects(() => service.consumeJobs(), stop);

  assert.equal(calls[0][0], 'markProcessing');
  assert.equal(calls[1][0], 'markCompleted');
});
