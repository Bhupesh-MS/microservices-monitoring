# Logger Package

Reusable structured JSON logger for all services.

## Usage

```js
const { createLogger } = require('@microservices-monitoring/logger');

const logger = createLogger('api');
logger.info('API listening', { port: 3000 });
```

## Environment

- `LOG_LEVEL=debug` enables debug log lines.

## Tests

From the repository root:

```bash
npm run test:logger
```
