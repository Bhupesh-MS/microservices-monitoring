# Env Package

Loads selected keys from the root `.env` file for local service development.

## Usage

```js
const { loadRootEnv } = require('@microservices-monitoring/env');

loadRootEnv(['PORT', 'REDIS_HOST', 'REDIS_PORT', 'JOB_QUEUE_NAME']);
```

Existing deployment environment variables are not overwritten.

## Tests

From the repository root:

```bash
npm run test:env
```
