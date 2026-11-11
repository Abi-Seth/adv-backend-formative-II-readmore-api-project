let previousWrite = Promise.resolve();

function withCatalogWrite(operation) {
  const result = previousWrite.then(operation);
  previousWrite = result.catch(() => {});
  return result;
}

module.exports = withCatalogWrite;
