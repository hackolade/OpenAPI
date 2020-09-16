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

function mapSchema(data, key, isParentActivated = false) {
	return typeHelper.getType(data, key, isParentActivated);
}

module.exports = {
	getSchemas,
	mapSchema
}