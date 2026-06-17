const client = require('prom-client');

client.collectDefaultMetrics({
  prefix: 'worker_'
});

const jobsProcessedTotal = new client.Counter({
  name: 'jobs_processed_total',
  help: 'Total number of jobs processed by this worker',
  labelNames: ['type', 'status']
});

const jobProcessingTimeSeconds = new client.Histogram({
  name: 'job_processing_time_seconds',
  help: 'Job processing time in seconds',
  labelNames: ['type'],
  buckets: [0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10, 30]
});

const jobErrorsTotal = new client.Counter({
  name: 'job_errors_total',
  help: 'Total number of failed jobs',
  labelNames: ['type']
});

module.exports = {
  register: client.register,
  jobsProcessedTotal,
  jobProcessingTimeSeconds,
  jobErrorsTotal
};
