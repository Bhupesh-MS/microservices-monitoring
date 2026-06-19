/**
 * @typedef {object} SerializedError
 * @property {string} name - Error class name.
 * @property {string} message - Error message.
 * @property {string|undefined} stack - Error stack trace.
 */

/**
 * @typedef {object} LoggerOutput
 * @property {(line: string) => void} log - Writes informational and debug log lines.
 * @property {(line: string) => void} warn - Writes warning log lines.
 * @property {(line: string) => void} error - Writes error log lines.
 */

/**
 * @typedef {object} Logger
 * @property {(message: string, meta?: object|Error) => void} info - Writes an info log entry.
 * @property {(message: string, meta?: object|Error) => void} warn - Writes a warning log entry.
 * @property {(message: string, meta?: object|Error) => void} error - Writes an error log entry.
 * @property {(message: string, meta?: object|Error) => void} debug - Writes a debug log entry when enabled.
 */

/**
 * Converts an Error object into JSON-safe metadata for structured logs.
 *
 * @param {Error} error - Error to serialize.
 * @returns {SerializedError} Serialized error details.
 */
function serializeError(error) {
  return {
    name: error.name,
    message: error.message,
    stack: error.stack
  };
}

/**
 * Normalizes optional log metadata into an object suitable for JSON serialization.
 *
 * @param {object|Error|undefined|null} meta - Metadata supplied with a log call.
 * @returns {object|undefined} Normalized metadata.
 */
function normalizeMeta(meta) {
  if (!meta) {
    return undefined;
  }

  if (meta instanceof Error) {
    return { error: serializeError(meta) };
  }

  return meta;
}

/**
 * Creates a structured JSON logger for a service.
 *
 * @param {string} serviceName - Service name included in every log entry.
 * @param {{output?: LoggerOutput}} [options={}] - Logger options.
 * @returns {Logger} Logger with level-specific write methods.
 */
function createLogger(serviceName, options = {}) {
  const output = options.output || console;

  /**
   * Writes a single structured log entry to the configured output.
   *
   * @param {'info'|'warn'|'error'|'debug'} level - Log level.
   * @param {string} message - Human-readable log message.
   * @param {object|Error|undefined} meta - Additional structured metadata.
   * @returns {void}
   */
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
    /** @type {(message: string, meta?: object|Error) => void} */
    info: (message, meta) => write('info', message, meta),
    /** @type {(message: string, meta?: object|Error) => void} */
    warn: (message, meta) => write('warn', message, meta),
    /** @type {(message: string, meta?: object|Error) => void} */
    error: (message, meta) => write('error', message, meta),
    /** @type {(message: string, meta?: object|Error) => void} */
    debug: (message, meta) => {
      if (process.env.LOG_LEVEL === 'debug') {
        write('debug', message, meta);
      }
    }
  };
}

module.exports = { createLogger };
