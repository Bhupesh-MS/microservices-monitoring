function getHealthStatus() {
  return { status: 'ok', service: 'stats' };
}

function getHealth(_req, res) {
  res.json(getHealthStatus());
}

module.exports = { getHealth, getHealthStatus };
