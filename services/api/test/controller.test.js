const assert = require('node:assert/strict');
const test = require('node:test');

function createJsonResponse() {
  return {
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
}

function withMockedJobService(factory, run) {
  const servicePath = require.resolve('../src/services/jobService');
  const controllerPaths = [
    require.resolve('../src/controllers/submitController'),
    require.resolve('../src/controllers/statusController')
  ];
  const originalService = require.cache[servicePath];

  require.cache[servicePath] = {
    id: servicePath,
    filename: servicePath,
    loaded: true,
    exports: { createJobService: factory }
  };

  for (const controllerPath of controllerPaths) {
    delete require.cache[controllerPath];
  }

  try {
    return run();
  } finally {
    if (originalService) {
      require.cache[servicePath] = originalService;
    } else {
      delete require.cache[servicePath];
    }

    for (const controllerPath of controllerPaths) {
      delete require.cache[controllerPath];
    }
  }
}

test('submit controller returns accepted job response', async () => {
  await withMockedJobService(
    () => ({
      submitJob: async (payload) => ({ id: 'job-1', status: 'queued', payload })
    }),
    async () => {
      const { submitJob } = require('../src/controllers/submitController');
      const res = createJsonResponse();

      await submitJob({ body: { limit: 20 } }, res, assert.fail);

      assert.equal(res.statusCode, 202);
      assert.deepEqual(res.body, { id: 'job-1', status: 'queued', payload: { limit: 20 } });
    }
  );
});

test('submit controller forwards service errors', async () => {
  const expected = new Error('submit failed');

  await withMockedJobService(
    () => ({
      submitJob: async () => {
        throw expected;
      }
    }),
    async () => {
      const { submitJob } = require('../src/controllers/submitController');
      let forwarded;

      await submitJob({ body: { limit: 20 } }, createJsonResponse(), (error) => {
        forwarded = error;
      });

      assert.equal(forwarded, expected);
    }
  );
});

test('status controller returns job, not found, and forwarded errors', async () => {
  await withMockedJobService(
    () => ({
      getJobStatus: async (id) => (id === 'missing' ? undefined : { id, status: 'completed' })
    }),
    async () => {
      const { getJobStatus } = require('../src/controllers/statusController');
      const found = createJsonResponse();
      const missing = createJsonResponse();

      await getJobStatus({ params: { id: 'job-1' } }, found, assert.fail);
      await getJobStatus({ params: { id: 'missing' } }, missing, assert.fail);

      assert.deepEqual(found.body, { id: 'job-1', status: 'completed' });
      assert.equal(missing.statusCode, 404);
      assert.deepEqual(missing.body, { error: 'Job not found' });
    }
  );

  const expected = new Error('lookup failed');

  await withMockedJobService(
    () => ({
      getJobStatus: async () => {
        throw expected;
      }
    }),
    async () => {
      const { getJobStatus } = require('../src/controllers/statusController');
      let forwarded;

      await getJobStatus({ params: { id: 'job-1' } }, createJsonResponse(), (error) => {
        forwarded = error;
      });

      assert.equal(forwarded, expected);
    }
  );
});

test('API server error handler returns validation and internal errors', () => {
  const { app } = require('../src/server');
  const errorLayer = app._router.stack.find((layer) => layer.handle.length === 4);
  const validationResponse = createJsonResponse();
  const internalResponse = createJsonResponse();

  errorLayer.handle(
    { statusCode: 400, message: 'bad request' },
    {},
    validationResponse,
    assert.fail
  );
  errorLayer.handle(new Error('boom'), {}, internalResponse, assert.fail);

  assert.equal(validationResponse.statusCode, 400);
  assert.deepEqual(validationResponse.body, { error: 'bad request' });
  assert.equal(internalResponse.statusCode, 500);
  assert.deepEqual(internalResponse.body, { error: 'Internal server error' });
});

test('API start returns the server from app.listen', () => {
  const originalPort = process.env.PORT;
  process.env.PORT = '0';

  delete require.cache[require.resolve('../src/server')];
  const { app, start } = require('../src/server');
  const originalListen = app.listen;
  const expectedServer = { close: () => {} };
  app.listen = (_port, callback) => {
    callback();
    return expectedServer;
  };
  const server = start();

  assert.equal(server, expectedServer);
  app.listen = originalListen;

  if (originalPort === undefined) {
    delete process.env.PORT;
  } else {
    process.env.PORT = originalPort;
  }

  delete require.cache[require.resolve('../src/server')];
});
