const client = require('prom-client');
const { createStatsService } = require('../services/statsService');

client.collectDefaultMetrics({
  prefix: 'stats_'
});

const totalJobsSubmitted = new client.Gauge({
  name: 'total_jobs_submitted',
  help: 'Total jobs submitted through the API'
});

const totalJobsCompleted = new client.Gauge({
  name: 'total_jobs_completed',
  help: 'Total jobs completed by workers'
});

const queueLength = new client.Gauge({
  name: 'queue_length',
  help: 'Current Redis job queue length'
});

const totalJobErrors = new client.Gauge({
  name: 'total_job_errors',
  help: 'Total failed jobs'
});

const avgJobProcessingTimeSeconds = new client.Gauge({
  name: 'avg_job_processing_time_seconds',
  help: 'Average completed job processing time in seconds'
});

async function collectStatsMetrics() {
  const statsService = createStatsService();
  const stats = await statsService.getStats();
  totalJobsSubmitted.set(stats.totalJobsSubmitted);
  totalJobsCompleted.set(stats.totalJobsCompleted);
  queueLength.set(stats.queueLength);
  totalJobErrors.set(stats.totalJobErrors);
  avgJobProcessingTimeSeconds.set(stats.avgProcessingTimeSeconds);
}

module.exports = {
  register: client.register,
  collectStatsMetrics
};
