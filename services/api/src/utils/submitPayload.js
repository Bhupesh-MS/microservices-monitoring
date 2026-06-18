class ValidationError extends Error {
  constructor(message) {
    super(message);
    this.name = 'ValidationError';
    this.statusCode = 400;
  }
}

function readPositiveInteger(value, fieldName) {
  const normalizedValue = typeof value === 'string' && value.trim() !== '' ? Number(value) : value;

  if (!Number.isSafeInteger(normalizedValue) || normalizedValue < 2) {
    throw new ValidationError(`${fieldName} must be an integer greater than or equal to 2`);
  }

  return normalizedValue;
}

function getMaxPrimeLimit() {
  return readPositiveInteger(Number(process.env.PRIME_LIMIT_MAX || 1000000), 'PRIME_LIMIT_MAX');
}

function assertSubmitPayloadShape(payload) {
  if (!payload || Array.isArray(payload) || typeof payload !== 'object') {
    throw new ValidationError('request body must be a JSON object with only the limit field');
  }

  const keys = Object.keys(payload);

  if (keys.length !== 1 || keys[0] !== 'limit') {
    throw new ValidationError('request body must contain only the limit field');
  }
}

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
