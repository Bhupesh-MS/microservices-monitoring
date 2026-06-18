function getPrimeLimit(payload = {}) {
  const limit = payload.limit ?? Number(process.env.PRIME_LIMIT || 100000);

  if (!Number.isSafeInteger(limit) || limit < 2) {
    throw new Error('Prime job limit must be an integer greater than or equal to 2');
  }

  return limit;
}

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
