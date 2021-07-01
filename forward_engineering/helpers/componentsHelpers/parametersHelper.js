const get = require('lodash.get');
const getExtensions = require('../extensionsHelper');
const { mapSchema } = require('./schemasHelper');
const { getExamples } = require('./examplesHelper');
const { getRef, hasRef, hasChoice } = require('../typeHelper');
const { commentDeactivatedItemInner } = require('../commentsHelper');
const { activateItem } = require('../commonHelper');

function getParameters(data) {
	if (!data || !data.properties) {
		return;
	}

	return Object.entries(data.properties)
		.map(([key, value]) => {
			const required = data.required ? data.required.includes(key) : false;
			return { key, value: mapParameter(activateItem(value), required, true) };
		})
		.reduce((acc, { key, value }) => {
			acc[key] = value;
			return acc;
		}, {});
}

function mapParameter(data, required, isParentActivated = false) {
	if (!data) {
		return;
	}
	if (hasRef(data)) {
		return commentDeactivatedItemInner(getRef(data), data.isActivated, isParentActivated);
	}
	const schemaKeyword = getSchemaKeyword(data.properties);
	const isActivated = data.isActivated && isParentActivated;
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
		schema: mapSchema(get(data, ['properties', schemaKeyword]), 'schema', isActivated),
		example: data.sample,
		examples: getExamples(get(data, 'properties.examples')),
		content: getContent(get(data, 'properties.content'), isActivated)
	};
	const extensions = getExtensions(data.scopesExtensions);

	return commentDeactivatedItemInner(Object.assign({}, parameter, extensions), data.isActivated, isParentActivated);
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

function getHeaders(data, isParentActivated = false) {
	if (!data || !data.properties) {
		return;
	}

	return Object.entries(data.properties)
		.map(([key, value]) => {
			const isActivated = value.isActivated;
			return {
				key,
				value: mapHeader(value, isActivated && isParentActivated),
				isActivated
			};
		})
		.reduce((acc, { key, value, isActivated }) => {
			acc[key] = commentDeactivatedItemInner(value, isActivated, isParentActivated);
			return acc;
		}, {});
}

function mapHeader(data, isParentActivated = false) {
	if (!data) {
		return;
	} 
	if (hasRef(data)) {
		return commentDeactivatedItemInner(getRef(data), data.isActivated, isParentActivated);
	}

	delete data.parameterName;
    return mapParameter(data, false, isParentActivated);
}

function getContent(data, isParentActivated) {
    if (!data || !data.properties) {
        return;
    }

    const result = Object.keys(data.properties).reduce((acc, key) => {
		const properties = get(data, `properties[${key}].properties`);
        if (!properties) {
            return acc;
		}
		const schemaKeyword = getSchemaKeyword(properties);

		if (!schemaKeyword) {
			return acc;
		}

		const isSchemaEmpty = properties[schemaKeyword] && get(properties, [schemaKeyword, 'type']) === 'object' && !get(properties, [schemaKeyword, 'properties']);
		const isExamplesEmpty = !get(properties, 'examples.properties');
		if (isSchemaEmpty && isExamplesEmpty) {
			return acc;
		}
		const isActivated = data.properties[key].isActivated;
        acc[key] = commentDeactivatedItemInner(
			mapMediaTypeObject(
				data.properties[key],
				isActivated && isParentActivated
			),
			isActivated,
			isParentActivated
		);
        return acc;
    }, {});

	if (!Object.keys(result).length) {
		return;
	}

	return result;
}

function mapMediaTypeObject(data, isParentActivated = false) {
    if (!data || !data.properties) {
        return;
	}
	const schemaKeyword = getSchemaKeyword(data.properties);
	let schema = mapSchema(get(data, ['properties', schemaKeyword]), 'schema', isParentActivated);
	if (!schema && hasChoice(data)) {
		schema = mapSchema({
			type: 'object',
			allOf: data.allOf,
			oneOf: data.oneOf,
			anyOf: data.anyOf,
			not: data.not
		}, 'schema', isParentActivated);
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

function prepareHeadersComponents(headers) {
	if (!headers || !headers.properties) {
		return;
	}

	for (const header in headers.properties) {
		headers.properties[header] = activateItem(headers.properties[header]);
	}

	return headers;
}

function getSchemaKeyword(properties = {}) {
	const defaultKeyword = 'schema'; 
	const restRequestPropNames = ['content', 'examples', 'encoding'];

	if (get(properties, defaultKeyword)) {
		return defaultKeyword;
	}

	const schemaKey = Object.keys(properties).find(key => !restRequestPropNames.includes(key));
	return schemaKey;
}

module.exports = {
	getParameters,
	mapParameter,
	getHeaders,
	mapHeader,
	getContent,
	prepareHeadersComponents
};