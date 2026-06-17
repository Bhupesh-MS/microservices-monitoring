function getHealthStatus() {
  return { status: 'ok', service: 'worker' };
}

function getHealth(_req, res) {
  res.json(getHealthStatus());
}

module.exports = { getHealth, getHealthStatus };
