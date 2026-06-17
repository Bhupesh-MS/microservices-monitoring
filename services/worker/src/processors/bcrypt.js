const bcrypt = require('bcryptjs');

function runBcryptHash(rounds = Number(process.env.BCRYPT_ROUNDS || 10)) {
  const input = `job-payload-${Date.now()}-${Math.random()}`;
  const hash = bcrypt.hashSync(input, rounds);

  return {
    rounds,
    hashPrefix: hash.slice(0, 20)
  };
}

module.exports = { runBcryptHash };
