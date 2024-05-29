const { activateItem } = require('../commonHelper');
const typeHelper = require('../typeHelper');

function getSchemas(data, specVersion) {
	if (!data || !data.properties) {
		return;
	}

	return Object.keys(data.properties).reduce((acc, key) => {
		acc[key] = mapSchema({ data: activateItem(data.properties[key]), key, isParentActivated: true, specVersion });
		return acc;
	}, {});
}

function mapSchema({ data, key, isParentActivated = false, specVersion }) {
	return typeHelper.getType({ data, key, isParentActivated, specVersion });
}

module.exports = {
	getSchemas,
	mapSchema,
};
