const express = require('express');
const submitRouter = require('./routes/submit');
const statusRouter = require('./routes/status');

const app = express();
const port = Number(process.env.PORT || 3000);

app.use(express.json({ limit: '1mb' }));

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'api' });
});

app.use('/submit', submitRouter);
app.use('/status', statusRouter);

app.use((error, _req, res, _next) => {
  console.error(error);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(port, () => {
  console.log(`API listening on port ${port}`);
});
