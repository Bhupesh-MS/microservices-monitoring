const assert = require('node:assert/strict');
const test = require('node:test');
const { createJobService } = require('../src/services/jobService');

test('job service submits normalized prime jobs through repository', async () => {
  let storedJob;
  const service = createJobService({
    jobRepository: {
      createQueuedJob: async (job) => {
        storedJob = job;
      }
    }
  });

  const result = await service.submitJob({ limit: 20 });

  assert.equal(result.type, 'prime');
  assert.equal(result.status, 'queued');
  assert.deepEqual(result.payload, { limit: 20 });
  assert.equal(storedJob.id, result.id);
  assert.deepEqual(storedJob.payload, { limit: 20 });
});

test('job service rejects payloads that omit limit', async () => {
  const service = createJobService({
    jobRepository: {
      createQueuedJob: async () => {}
    }
  });

  await assert.rejects(() => service.submitJob({}), {
    name: 'ValidationError',
    statusCode: 400
  });
});

test('job service rejects invalid prime limit', async () => {
  const service = createJobService({
    jobRepository: {
      createQueuedJob: async () => {}
    }
  });

  await assert.rejects(() => service.submitJob({ limit: 1 }), {
    name: 'ValidationError',
    statusCode: 400
  });
});
