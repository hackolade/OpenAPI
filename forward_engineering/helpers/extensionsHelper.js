function getExtensions(data = []) {
	return data
		.filter(filterExtensionsByPrefix)
		.reduce((acc, { extensionPattern, extensionValue }) => {
			let parsedValue;
			try {
				parsedValue = JSON.parse(extensionValue);
			} catch(err) {
				parsedValue = extensionValue;
			}
			acc[extensionPattern] = parsedValue;

			return acc;
		}, {});

}

function filterExtensionsByPrefix({ extensionPattern }) {
	return extensionPattern && extensionPattern.startsWith('x-');
}

module.exports = getExtensions;