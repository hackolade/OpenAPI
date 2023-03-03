function isTargetVersionJSONSchemaCompatible(specVersion) {
	const splitVersion = specVersion.split('.');
	return splitVersion[0] === '3' && splitVersion[1] >= '1';
}

module.exports = {
	isTargetVersionJSONSchemaCompatible,
}