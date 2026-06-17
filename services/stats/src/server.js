const express = require('express');
const { router: statsRouter } = require('./routes/stats');
const { register, collectStatsMetrics } = require('./metrics/prometheus');

const app = express();
const port = Number(process.env.PORT || 3000);

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'stats' });
});

app.use('/stats', statsRouter);

app.get('/metrics', async (_req, res, next) => {
  try {
    await collectStatsMetrics();
    res.set('Content-Type', register.contentType);
    res.end(await register.metrics());
  } catch (error) {
    next(error);
  }
});

app.use((error, _req, res, _next) => {
  console.error(error);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(port, () => {
  console.log(`Stats service listening on port ${port}`);
});
