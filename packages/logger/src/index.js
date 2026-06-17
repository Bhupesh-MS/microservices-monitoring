function serializeError(error) {
  return {
    name: error.name,
    message: error.message,
    stack: error.stack
  };
}

function normalizeMeta(meta) {
  if (!meta) {
    return undefined;
  }

  if (meta instanceof Error) {
    return { error: serializeError(meta) };
  }

  return meta;
}

function createLogger(serviceName, options = {}) {
  const output = options.output || console;

  function write(level, message, meta) {
    const entry = {
      timestamp: new Date().toISOString(),
      level,
      service: serviceName,
      message
    };
    const normalizedMeta = normalizeMeta(meta);
    const payload = normalizedMeta ? { ...entry, ...normalizedMeta } : entry;
    const line = JSON.stringify(payload);

    if (level === 'error') {
      output.error(line);
      return;
    }

    if (level === 'warn') {
      output.warn(line);
      return;
    }

    output.log(line);
  }

  return {
    info: (message, meta) => write('info', message, meta),
    warn: (message, meta) => write('warn', message, meta),
    error: (message, meta) => write('error', message, meta),
    debug: (message, meta) => {
      if (process.env.LOG_LEVEL === 'debug') {
        write('debug', message, meta);
      }
    }
  };
}

module.exports = { createLogger };
