/**
 * @typedef {object} PrimePayload
 * @property {number} [limit] - Inclusive upper bound for prime calculation.
 */

/**
 * @typedef {object} PrimeResult
 * @property {number} limit - Limit used for the calculation.
 * @property {number} count - Number of primes found.
 * @property {number|undefined} lastPrime - Largest prime found, if any.
 * @property {number[]} primes - Prime numbers up to the limit.
 */

/**
 * Resolves and validates the prime calculation limit from a job payload.
 *
 * @param {PrimePayload} [payload={}] - Prime job payload.
 * @returns {number} Validated prime limit.
 * @throws {Error} When the limit is not a safe integer greater than or equal to 2.
 */
function getPrimeLimit(payload = {}) {
  const limit = payload.limit ?? Number(process.env.PRIME_LIMIT || 100000);

  if (!Number.isSafeInteger(limit) || limit < 2) {
    throw new Error('Prime job limit must be an integer greater than or equal to 2');
  }

  return limit;
}

/**
 * Calculates all prime numbers up to the requested limit.
 *
 * @param {PrimePayload} [payload={}] - Prime job payload.
 * @returns {PrimeResult} Prime calculation result.
 * @throws {Error} When the payload limit is invalid.
 */
function calculatePrimes(payload = {}) {
  const limit = getPrimeLimit(payload);
  const primes = [];

  for (let number = 2; number <= limit; number += 1) {
    let isPrime = true;

    for (let divisor = 2; divisor * divisor <= number; divisor += 1) {
      if (number % divisor === 0) {
        isPrime = false;
        break;
      }
    }

    if (isPrime) {
      primes.push(number);
    }
  }

  return {
    limit,
    count: primes.length,
    lastPrime: primes[primes.length - 1],
    primes
  };
}

module.exports = { calculatePrimes, getPrimeLimit };
