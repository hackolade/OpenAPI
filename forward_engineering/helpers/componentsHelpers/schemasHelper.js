const typeHelper = require('../typeHelper');

function getSchemas(data) {
	if (!data || !data.properties) {
		return;
	}

	return Object.keys(data.properties).reduce((acc, key) => {
		acc[key] = mapSchema(data.properties[key], key);
		return acc;
	}, {});
}

function mapSchema(data, key) {
	return typeHelper.getType(data, key);
}

module.exports = {
	getSchemas,
	mapSchema
}