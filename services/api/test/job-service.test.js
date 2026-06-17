const assert = require('node:assert/strict');
const test = require('node:test');
const { createJobService } = require('../src/services/jobService');

test('job service submits queued jobs through repository', async () => {
  let storedJob;
  const service = createJobService({
    jobRepository: {
      createQueuedJob: async (job) => {
        storedJob = job;
      }
    }
  });

  const result = await service.submitJob({ type: 'prime' });

  assert.equal(result.type, 'prime');
  assert.equal(result.status, 'queued');
  assert.equal(storedJob.id, result.id);
  assert.deepEqual(storedJob.payload, { type: 'prime' });
});
