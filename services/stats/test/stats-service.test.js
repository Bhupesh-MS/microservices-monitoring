const assert = require('node:assert/strict');
const test = require('node:test');
const { createStatsService } = require('../src/services/statsService');

test('stats service returns repository stats', async () => {
  const expectedStats = {
    totalJobsSubmitted: 2,
    totalJobsCompleted: 1,
    totalJobErrors: 0,
    queueLength: 1,
    avgProcessingTimeSeconds: 0.5
  };
  const service = createStatsService({
    statsRepository: {
      getJobStats: async () => expectedStats
    }
  });

  assert.deepEqual(await service.getStats(), expectedStats);
});
