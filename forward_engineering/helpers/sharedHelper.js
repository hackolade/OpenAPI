function isTargetVersionJSONSchemaCompatible(specVersion) {
	const splitVersion = specVersion.split('.');
	return splitVersion[0] === '3' && splitVersion[1] >= '1';
}

function getArrayItems({ items, prefixItems }) {
	if (Array.isArray(prefixItems) || typeof items === 'boolean') {
		return prefixItems;
	}

	return items;
}

module.exports = {
	isTargetVersionJSONSchemaCompatible,
	getArrayItems,
}