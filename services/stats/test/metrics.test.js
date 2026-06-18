const assert = require('node:assert/strict');
const test = require('node:test');

test('collectStatsMetrics reads stats and exposes Prometheus output', async () => {
  const servicePath = require.resolve('../src/services/statsService');
  const metricsPath = require.resolve('../src/metrics/prometheus');
  const originalService = require.cache[servicePath];

  require.cache[servicePath] = {
    id: servicePath,
    filename: servicePath,
    loaded: true,
    exports: {
      createStatsService: () => ({
        getStats: async () => ({
          totalJobsSubmitted: 10,
          totalJobsCompleted: 8,
          totalJobErrors: 1,
          queueLength: 3,
          avgProcessingTimeSeconds: 0.5
        })
      })
    }
  };
  delete require.cache[metricsPath];

  try {
    const { collectStatsMetrics, register } = require('../src/metrics/prometheus');

    await collectStatsMetrics();
    const metrics = await register.metrics();

    assert.match(metrics, /total_jobs_submitted 10/);
    assert.match(metrics, /queue_length 3/);
    register.clear();
  } finally {
    if (originalService) {
      require.cache[servicePath] = originalService;
    } else {
      delete require.cache[servicePath];
    }

    delete require.cache[metricsPath];
  }
});
