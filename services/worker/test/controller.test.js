const assert = require('node:assert/strict');
const test = require('node:test');

function createResponse() {
  return {
    headers: {},
    body: undefined,
    json(payload) {
      this.body = payload;
      return this;
    },
    set(name, value) {
      this.headers[name] = value;
      return this;
    },
    end(payload) {
      this.body = payload;
      return this;
    }
  };
}

test('worker health controller writes JSON response', () => {
  const { getHealth } = require('../src/controllers/healthController');
  const res = createResponse();

  getHealth({}, res);

  assert.deepEqual(res.body, { status: 'ok', service: 'worker' });
});

test('worker metrics controller writes metrics and forwards errors', async () => {
  const controllerPath = require.resolve('../src/controllers/metricsController');
  const metricsPath = require.resolve('../src/metrics/prometheus');
  const originalMetrics = require.cache[metricsPath];

  require.cache[metricsPath] = {
    id: metricsPath,
    filename: metricsPath,
    loaded: true,
    exports: {
      register: {
        contentType: 'text/plain',
        metrics: async () => 'jobs_processed_total 1'
      }
    }
  };
  delete require.cache[controllerPath];

  try {
    const { getMetrics } = require('../src/controllers/metricsController');
    const res = createResponse();

    await getMetrics({}, res, assert.fail);

    assert.equal(res.headers['Content-Type'], 'text/plain');
    assert.equal(res.body, 'jobs_processed_total 1');
  } finally {
    if (originalMetrics) {
      require.cache[metricsPath] = originalMetrics;
    } else {
      delete require.cache[metricsPath];
    }

    delete require.cache[controllerPath];
  }

  const expected = new Error('metrics failed');
  require.cache[metricsPath] = {
    id: metricsPath,
    filename: metricsPath,
    loaded: true,
    exports: {
      register: {
        contentType: 'text/plain',
        metrics: async () => {
          throw expected;
        }
      }
    }
  };

  try {
    const { getMetrics } = require('../src/controllers/metricsController');
    let forwarded;

    await getMetrics({}, createResponse(), (error) => {
      forwarded = error;
    });

    assert.equal(forwarded, expected);
  } finally {
    if (originalMetrics) {
      require.cache[metricsPath] = originalMetrics;
    } else {
      delete require.cache[metricsPath];
    }

    delete require.cache[controllerPath];
  }
});

test('worker module exports configured Express app', () => {
  const originalPort = process.env.PORT;
  process.env.PORT = '0';
  delete require.cache[require.resolve('../src/worker')];
  const { app } = require('../src/worker');

  assert.ok(app._router.stack.some((layer) => layer.route?.path === '/health'));
  assert.ok(app._router.stack.some((layer) => layer.route?.path === '/metrics'));

  if (originalPort === undefined) {
    delete process.env.PORT;
  } else {
    process.env.PORT = originalPort;
  }

  delete require.cache[require.resolve('../src/worker')];
});

test('worker start creates Redis clients and starts consumer', async () => {
  const originalPort = process.env.PORT;
  process.env.PORT = '0';
  const redisPath = require.resolve('@microservices-monitoring/redis');
  const servicePath = require.resolve('../src/services/workerService');
  const workerPath = require.resolve('../src/worker');
  const originalRedis = require.cache[redisPath];
  const originalService = require.cache[servicePath];
  let redisClients = 0;
  let consumed = false;

  require.cache[redisPath] = {
    id: redisPath,
    filename: redisPath,
    loaded: true,
    exports: {
      createRedisClient: () => {
        redisClients += 1;
        return {};
      }
    }
  };
  require.cache[servicePath] = {
    id: servicePath,
    filename: servicePath,
    loaded: true,
    exports: {
      createWorkerService: () => ({
        consumeJobs: async () => {
          consumed = true;
        }
      })
    }
  };
  delete require.cache[workerPath];

  try {
    const { app, start } = require('../src/worker');
    const originalListen = app.listen;
    const expectedServer = { close: () => {} };
    app.listen = (_port, callback) => {
      callback();
      return expectedServer;
    };
    const server = start();

    await new Promise((resolve) => setImmediate(resolve));

    assert.equal(redisClients, 2);
    assert.equal(consumed, true);
    assert.equal(server, expectedServer);
    app.listen = originalListen;
  } finally {
    if (originalRedis) {
      require.cache[redisPath] = originalRedis;
    } else {
      delete require.cache[redisPath];
    }

    if (originalService) {
      require.cache[servicePath] = originalService;
    } else {
      delete require.cache[servicePath];
    }

    if (originalPort === undefined) {
      delete process.env.PORT;
    } else {
      process.env.PORT = originalPort;
    }

    delete require.cache[workerPath];
  }
});
