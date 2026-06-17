# Stats Service

The stats service reads aggregate counters and queue state from Redis and exposes them as JSON and Prometheus metrics.

## Endpoints

- `GET /health` returns service health.
- `GET /stats` returns submitted/completed/error totals, queue length, and average processing time.
- `GET /metrics` exposes Prometheus metrics.

## Environment

The stats service loads only these values from the root `.env` file during local development:

- `PORT`
- `REDIS_HOST`
- `REDIS_PORT`
- `JOB_QUEUE_NAME`

## Local Development

From the repository root:

```bash
npm install
npm run dev --workspace services/stats
```

Run tests from the root:

```bash
npm test --workspace services/stats
```

Or run all service tests:

```bash
npm test
```

## Source Structure

- `src/controllers` contains HTTP handlers.
- `src/services` contains stats business logic.
- `src/metrics` contains Prometheus metric registration and collection.
- Redis persistence is accessed through repositories exported by `@microservices-monitoring/redis`.

## Docker

Build from the repository root so the shared logger and Redis packages are included:

```bash
docker build -f services/stats/Dockerfile -t microservices-monitoring/stats:latest .
```
