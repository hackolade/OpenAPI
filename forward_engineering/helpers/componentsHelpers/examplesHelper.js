const getExtensions = require('../extensionsHelper');
const { getRef, hasRef } = require('../typeHelper');

function getExamples(data) {
	if (!data || !data.properties) {
		return;
	}

	return Object.entries(data.properties)
		.map(([key, value]) => {
			return {
				key,
				value: mapExample(value)
			};
		})
		.reduce((acc, { key, value }) => {
			acc[key] = value;
			return acc;
		}, {});
}

function mapExample(data) {
	if (!data) {
		return;
	} 
	if (hasRef(data)) {
		return getRef(data);
	}
	
	const { summary, description, value, externalValue, scopesExtensions } = data;
	let parsedValue;
	try {
		parsedValue = JSON.parse(value);
	} catch(err) {
		parsedValue = value;
	}
    const example = {
        summary,
        description,
        value: parsedValue,
        externalValue
    };
    const extensions = getExtensions(scopesExtensions);

    return Object.assign({}, example, extensions);
}

module.exports = {
	getExamples,
	mapExample
}