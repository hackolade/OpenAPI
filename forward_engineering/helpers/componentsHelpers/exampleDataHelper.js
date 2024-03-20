const { parseExample } = require('./../typeHelper');

function parseExampleValueByDataType(value, type) {
  const parsedValue = parseExample(value);

  switch (type) {
    case 'string':
      if (typeof parsedValue === 'string') {
        return parsedValue;
      }
      break;
    case 'number':
    case 'integer':
      if (!isNaN(parsedValue)) {
        return parsedValue;
      }
      break;
    case 'array':
      if (Array.isArray(parsedValue)) {
        return parsedValue;
      }
      break;
    case 'object':
      if (typeof parsedValue === 'object' && parsedValue !== null) {
        return parsedValue;
      }
      break;
    case 'boolean':
      if (typeof parsedValue === 'boolean') {
        return parsedValue;
      }
  }

  return value;
}

module.exports = {
  parseExampleValueByDataType
};
