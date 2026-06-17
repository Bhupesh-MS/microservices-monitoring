function generateAndSort(size = Number(process.env.SORT_SIZE || 100000)) {
  const values = Array.from({ length: size }, () => Math.floor(Math.random() * size * 10));
  values.sort((a, b) => a - b);

  return {
    size,
    min: values[0],
    max: values[values.length - 1],
    median: values[Math.floor(values.length / 2)]
  };
}

module.exports = { generateAndSort };
