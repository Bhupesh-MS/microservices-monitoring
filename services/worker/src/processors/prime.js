function calculatePrimes(limit = Number(process.env.PRIME_LIMIT || 100000)) {
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
    lastPrime: primes[primes.length - 1]
  };
}

module.exports = { calculatePrimes };
