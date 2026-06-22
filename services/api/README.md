# API Service

The API service accepts job submissions and exposes job status lookup endpoints.

## Endpoints

- `GET /health` returns service health.
- `POST /submit` submits a prime job payload with exactly one field: `limit`.
- `GET /status/:id` returns the stored status and result for a job.

## Environment

The API service loads only these values from the root `.env` file during local development:

- `PORT`
- `REDIS_HOST`
- `REDIS_PORT`
- `JOB_QUEUE_NAME`
- `PRIME_LIMIT_MAX`
- `CORS_ORIGIN`
- `RATE_LIMIT_WINDOW_MS`
- `RATE_LIMIT_MAX_REQUESTS`

## Local Development

From the repository root:

```bash
npm install
npm run dev --workspace services/api
```

Run tests from the root:

```bash
npm test --workspace services/api
```

Or run all service tests:

```bash
npm test
```

## Source Structure

- `src/controllers` contains HTTP handlers.
- `src/services` contains API business logic.
- `src/utils` contains local helper functions.
- Redis persistence is accessed through repositories exported by `@microservices-monitoring/redis`.

## Docker

Build from the repository root so the shared logger and Redis packages are included:

```bash
docker build -f services/api/Dockerfile -t microservices-monitoring/api:latest .
```
