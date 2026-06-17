# Worker Service

The worker service consumes Redis jobs, runs CPU-heavy processors, stores results, and exposes Prometheus metrics.

## Endpoints

- `GET /health` returns service health.
- `GET /metrics` exposes Prometheus metrics.

## Environment

The worker service loads only these values from the root `.env` file during local development:

- `PORT`
- `REDIS_HOST`
- `REDIS_PORT`
- `JOB_QUEUE_NAME`
- `PRIME_LIMIT`
- `BCRYPT_ROUNDS`
- `SORT_SIZE`

## Local Development

From the repository root:

```bash
npm install
npm run dev --workspace services/worker
```

Run tests from the root:

```bash
npm test --workspace services/worker
```

Or run all service tests:

```bash
npm test
```

## Source Structure

- `src/controllers` contains HTTP handlers for health and metrics.
- `src/services` contains worker job-consumption logic.
- `src/utils` contains local job-processing dispatch helpers.
- `src/processors` contains CPU-bound job implementations.
- Redis persistence is accessed through repositories exported by `@microservices-monitoring/redis`.

## Docker

Build from the repository root so the shared logger and Redis packages are included:

```bash
docker build -f services/worker/Dockerfile -t microservices-monitoring/worker:latest .
```
