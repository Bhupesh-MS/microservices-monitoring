const jobTypes = ['prime', 'bcrypt', 'sort'];

function pickJobType(type) {
  return jobTypes.includes(type) ? type : jobTypes[Math.floor(Math.random() * jobTypes.length)];
}

module.exports = { jobTypes, pickJobType };
