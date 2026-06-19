/**
 * @typedef {object} SubmitPayload
 * @property {number|string} limit - Requested prime calculation limit.
 */

/**
 * @typedef {object} NormalizedSubmitPayload
 * @property {number} limit - Validated prime calculation limit.
 */

/**
 * Error type used for client-side submit payload validation failures.
 */
class ValidationError extends Error {
  /**
   * Creates a validation error with HTTP 400 semantics.
   *
   * @param {string} message - Validation failure message.
   */
  constructor(message) {
    super(message);
    this.name = 'ValidationError';
    this.statusCode = 400;
  }
}

/**
 * Reads and validates an integer value that must be at least 2.
 *
 * @param {unknown} value - Candidate integer value.
 * @param {string} fieldName - Field name used in validation messages.
 * @returns {number} Validated positive integer.
 * @throws {ValidationError} When the value is not a safe integer greater than or equal to 2.
 */
function readPositiveInteger(value, fieldName) {
  const normalizedValue = typeof value === 'string' && value.trim() !== '' ? Number(value) : value;

  if (!Number.isSafeInteger(normalizedValue) || normalizedValue < 2) {
    throw new ValidationError(`${fieldName} must be an integer greater than or equal to 2`);
  }

  return normalizedValue;
}

/**
 * Reads the configured maximum prime limit.
 *
 * @returns {number} Maximum accepted prime limit.
 * @throws {ValidationError} When PRIME_LIMIT_MAX is invalid.
 */
function getMaxPrimeLimit() {
  return readPositiveInteger(Number(process.env.PRIME_LIMIT_MAX || 1000000), 'PRIME_LIMIT_MAX');
}

/**
 * Ensures the submit body contains exactly the supported API payload shape.
 *
 * @param {unknown} payload - Request body candidate.
 * @returns {void}
 * @throws {ValidationError} When the payload is not an object with only `limit`.
 */
function assertSubmitPayloadShape(payload) {
  if (!payload || Array.isArray(payload) || typeof payload !== 'object') {
    throw new ValidationError('request body must be a JSON object with only the limit field');
  }

  const keys = Object.keys(payload);

  if (keys.length !== 1 || keys[0] !== 'limit') {
    throw new ValidationError('request body must contain only the limit field');
  }
}

/**
 * Validates and normalizes a submit request payload.
 *
 * @param {unknown} [input={}] - Raw request body.
 * @returns {NormalizedSubmitPayload} Payload used for queued prime jobs.
 * @throws {ValidationError} When the payload shape or limit value is invalid.
 */
function normalizeSubmitPayload(input = {}) {
  const payload = input ?? {};
  assertSubmitPayloadShape(payload);

  const limit = readPositiveInteger(payload.limit, 'limit');
  const maxLimit = getMaxPrimeLimit();

  if (limit > maxLimit) {
    throw new ValidationError(`limit must be less than or equal to ${maxLimit}`);
  }

  return { limit };
}

module.exports = {
  ValidationError,
  normalizeSubmitPayload
};
