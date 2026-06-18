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

function withMockedModule(modulePath, exports, run) {
  const resolvedPath = require.resolve(modulePath);
  const original = require.cache[resolvedPath];

  require.cache[resolvedPath] = {
    id: resolvedPath,
    filename: resolvedPath,
    loaded: true,
    exports
  };

  try {
    return run();
  } finally {
    if (original) {
      require.cache[resolvedPath] = original;
    } else {
      delete require.cache[resolvedPath];
    }
  }
}

test('stats health controller writes JSON response', () => {
  const { getHealth } = require('../src/controllers/healthController');
  const res = createResponse();

  getHealth({}, res);

  assert.deepEqual(res.body, { status: 'ok', service: 'stats' });
});

test('stats controller returns service stats and forwards errors', async () => {
  const controllerPath = require.resolve('../src/controllers/statsController');

  await withMockedModule(
    '../src/services/statsService',
    {
      createStatsService: () => ({
        getStats: () => ({ totalJobsSubmitted: 2 })
      })
    },
    async () => {
      delete require.cache[controllerPath];
      const { getStats } = require('../src/controllers/statsController');
      const res = createResponse();

      await getStats({}, res, assert.fail);

      assert.deepEqual(res.body, { totalJobsSubmitted: 2 });
    }
  );

  const expected = new Error('stats failed');

  await withMockedModule(
    '../src/services/statsService',
    {
      createStatsService: () => ({
        getStats: () => {
          throw expected;
        }
      })
    },
    async () => {
      delete require.cache[controllerPath];
      const { getStats } = require('../src/controllers/statsController');
      let forwarded;

      await getStats({}, createResponse(), (error) => {
        forwarded = error;
      });

      assert.equal(forwarded, expected);
    }
  );

  delete require.cache[controllerPath];
});

test('stats metrics controller writes metrics and forwards errors', async () => {
  const controllerPath = require.resolve('../src/controllers/metricsController');
  const metricsPath = '../src/metrics/prometheus';

  await withMockedModule(
    metricsPath,
    {
      collectStatsMetrics: async () => {},
      register: {
        contentType: 'text/plain',
        metrics: async () => 'metric 1'
      }
    },
    async () => {
      delete require.cache[controllerPath];
      const { getMetrics } = require('../src/controllers/metricsController');
      const res = createResponse();

      await getMetrics({}, res, assert.fail);

      assert.equal(res.headers['Content-Type'], 'text/plain');
      assert.equal(res.body, 'metric 1');
    }
  );

  const expected = new Error('metrics failed');

  await withMockedModule(
    metricsPath,
    {
      collectStatsMetrics: async () => {
        throw expected;
      },
      register: {
        contentType: 'text/plain',
        metrics: async () => ''
      }
    },
    async () => {
      delete require.cache[controllerPath];
      const { getMetrics } = require('../src/controllers/metricsController');
      let forwarded;

      await getMetrics({}, createResponse(), (error) => {
        forwarded = error;
      });

      assert.equal(forwarded, expected);
    }
  );

  delete require.cache[controllerPath];
});

test('stats server error handler and start use Express app wiring', () => {
  const originalPort = process.env.PORT;
  process.env.PORT = '0';
  delete require.cache[require.resolve('../src/server')];
  const { app, start } = require('../src/server');
  const errorLayer = app._router.stack.find((layer) => layer.handle.length === 4);
  const errorResponse = {
    statusCode: 200,
    body: undefined,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.body = payload;
      return this;
    }
  };
  const originalListen = app.listen;
  const expectedServer = { close: () => {} };

  errorLayer.handle(new Error('route failed'), {}, errorResponse, assert.fail);

  app.listen = (_port, callback) => {
    callback();
    return expectedServer;
  };

  assert.equal(start(), expectedServer);
  app.listen = originalListen;
  assert.equal(errorResponse.statusCode, 500);
  assert.deepEqual(errorResponse.body, { error: 'Internal server error' });

  if (originalPort === undefined) {
    delete process.env.PORT;
  } else {
    process.env.PORT = originalPort;
  }

  delete require.cache[require.resolve('../src/server')];
});
