function getExtensions(data = []) {
	return data
		.filter(filterExtensionsByPrefix)
		.reduce((acc, { extensionPattern, extensionValue }) => {
			acc[extensionPattern] = extensionValue;
			return acc;
		}, {});

}

function filterExtensionsByPrefix({ extensionPattern }) {
	return extensionPattern && extensionPattern.startsWith('x-');
}

module.exports = getExtensions;