function isTargetVersionJSONSchemaCompatible(specVersion) {
	const splitVersion = specVersion.split('.');
	return splitVersion[0] === '3' && splitVersion[1] >= '1';
}

function getArrayItems({ items, prefixItems, specVersion }) {
	if (!isTargetVersionJSONSchemaCompatible(specVersion)) {
		return items;
	}
	if (Array.isArray(prefixItems) || typeof items === 'boolean') {
		return prefixItems;
	}

	return items;
}

function isNotEmptyString(value) {
	return typeof value === 'string' && value.trim() !== '';
}

module.exports = {
	isTargetVersionJSONSchemaCompatible,
	getArrayItems,
	isNotEmptyString,
};
