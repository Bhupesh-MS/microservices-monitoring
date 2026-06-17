function getHealthStatus() {
  return { status: 'ok', service: 'api' };
}

function getHealth(_req, res) {
  res.json(getHealthStatus());
}

module.exports = { getHealth, getHealthStatus };
