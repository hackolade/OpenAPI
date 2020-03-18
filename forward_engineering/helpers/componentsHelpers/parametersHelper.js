const get = require('lodash.get');
const getExtensions = require('../extensionsHelper');
const { mapSchema } = require('./schemasHelper');
const { getExamples } = require('./examplesHelper');
const { getRef, hasRef, hasChoice } = require('../typeHelper');

function getParameters(data) {
	if (!data || !data.properties) {
		return;
	}

	return Object.entries(data.properties)
		.map(([key, value]) => {
			const required = data.required ? data.required.includes(key) : false;
			return { key, value: mapParameter(value, required) };
		})
		.reduce((acc, { key, value }) => {
			acc[key] = value;
			return acc;
		}, {});
}

function mapParameter(data, required) {
	if (!data) {
		return;
	}
	if (hasRef(data)) {
		return getRef(data);
	}

	const parameter = {
		name: data.parameterName,
		in: getIn(data.type),
		description: data.description,
		required: !!(required || data.required) || undefined,
		deprecated: data.deprecated,
		allowEmptyValue: data.allowEmptyValue,
		style: data.style,
		explode: data.explode,
		allowReserved: data.allowReserved,
		schema: mapSchema(get(data, 'properties.schema'), 'schema'),
		example: data.sample,
		examples: getExamples(get(data, 'properties.examples')),
		content: getContent(get(data, 'properties.content'))
	};
	const extensions = getExtensions(data.scopesExtensions);

	return Object.assign({}, parameter, extensions);
}

function getIn(parameterType) {
	const parameterTypeToIn = {
		'parameter (query)': 'query',
		'parameter (cookie)': 'cookie',
		'parameter (path)': 'path',
		'parameter (header)': 'header'
	};

	return parameterTypeToIn[parameterType];
}

function getHeaders(data) {
	if (!data || !data.properties) {
		return;
	}

	return Object.entries(data.properties)
		.map(([key, value]) => {
			return {
				key,
				value: mapHeader(value)
			};
		})
		.reduce((acc, { key, value }) => {
			acc[key] = value;
			return acc;
		}, {});
}

function mapHeader(data) {
	if (!data) {
		return;
	} 
	if (hasRef(data)) {
		return getRef(data);
	}

	delete data.parameterName;
    return mapParameter(data);
}

function getContent(data) {
    if (!data || !data.properties) {
        return;
    }

    return Object.keys(data.properties).reduce((acc, key) => {
		const properties = get(data, `properties[${key}].properties`);
        if (!properties) {
            return;
		}
		const isSchemaEmpty = properties.schema && get(properties.schema, 'type') === 'object' && !get(properties.schema, 'properties');
		const isExamplesEmpty = !get(properties, 'examples.properties');
		if (isSchemaEmpty && isExamplesEmpty) {
			return;
		}
        acc[key] = mapMediaTypeObject(data.properties[key]);
        return acc;
    }, {});
}

function mapMediaTypeObject(data) {
    if (!data || !data.properties) {
        return;
    }
	let schema = mapSchema(get(data, 'properties.schema'), 'schema');
	if (!schema && hasChoice(data)) {
		schema = mapSchema({
			type: 'object',
			allOf: data.allOf,
			oneOf: data.oneOf,
			anyOf: data.anyOf,
			not: data.not
		}, 'schema');
	}
    const examples = getExamples(get(data, 'properties.examples'));
    const encoding = mapEncoding(get(data, 'properties.encoding'));
	let example;
	try {
		example = JSON.parse(data.sample);
	} catch(err) {
		example = data.sample;
	}
	const mediaTypeObj = { schema, examples, encoding, example };
    const extensions = getExtensions(data.scopesExtensions);

    return Object.assign({}, mediaTypeObj, extensions);
}

function mapEncoding(data) {
    if (!data || !data.properties) {
        return;
    }

    return Object.entries(data.properties)
        .map(([key, value]) => {
            const encodingObj = {
                contentType: value.contentType,
                headers: getHeaders(get(value, 'properties.headers')),
                style: value.style,
                explode: value.explode || undefined,
                allowReserved: value.allowReserved || undefined
            };
            const extensions = getExtensions(value.scopesExtensions);

            return { key, value: Object.assign({}, encodingObj, extensions) };
        })
        .reduce((acc, { key, value }) => {
            acc[key] = value;
            return acc;
        }, {});
}

module.exports = {
	getParameters,
	mapParameter,
	getHeaders,
	mapHeader,
	getContent
};