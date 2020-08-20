const get = require('lodash.get');
const getExtensions = require('./extensionsHelper');
const { prepareReferenceName } = require('../utils/utils');

function getType(data, key) {
	if (!data) {
		return;
	}

	if (Array.isArray(data.type)) {
		return getType(Object.assign({}, data, { type: data.type[0] }));
	}

	if (hasRef(data)) {
		return getRef(data);
	}
	
	return getTypeProps(data, key);
}

function getTypeProps(data, key) {
	const { type, properties, items, required } = data;

    const extensions = getExtensions(data.scopesExtensions);

	switch (type) {
		case 'array': {
			const arrayProps = {
				type,
				items: getArrayItemsType(items),
				collectionFormat: data.collectionFormat,
				minItems: data.minItems,
				maxItems: data.maxItems,
				uniqueItems: data.uniqueItems || undefined,
				nullable: data.nullable,
				discriminator: data.discriminator,
				readOnly: data.readOnly,
				xml: getXml(data.xml)
			};
			const arrayChoices = getChoices(data, key);

			return Object.assign({}, arrayProps, arrayChoices, extensions);
		}
		case 'object': {
			const objectProps = {
				type,
				description: data.description || undefined,
				required: required || undefined,
				properties: getObjectProperties(properties),
				minProperties: data.minProperties,
				maxProperties: data.maxProperties,
				additionalProperties: getAdditionalProperties(data),
				nullable: data.nullable,
				discriminator: data.discriminator,
				readOnly: data.readOnly,
				example: parseExample(data.sample),
				xml: getXml(data.xml)
			};
			const objectChoices = getChoices(data, key);

			return Object.assign({}, objectProps, objectChoices, extensions);
		}
		case 'parameter':
			if (!properties || properties.length === 0) {
				return;
			}
			return getType(properties[Object.keys(properties)[0]]);
		default:
			return getPrimitiveTypeProps(data);
	}
}

function getRef({ $ref: ref }) {
	if (ref.startsWith('#')) {
		ref = ref.replace('#model/definitions', '#/components');

		return { $ref: prepareReferenceName(ref) };
	}

	const [ pathToFile, relativePath] = ref.split('#/');
	if (!relativePath) {
		return { $ref: prepareReferenceName(ref) };
	}

	let path = relativePath.split('/');
	if (path[0] === 'definitions') {
		if (path[2] === 'schemas') {
			return { $ref: `${pathToFile}#/components/schemas/${path.slice(4).join('/')}` };
		}

		path = ['', ...path];
	}

	const schemaIndex = path.indexOf('schema');
	const hasSchema = schemaIndex !== -1;
	const isComponents = (path[1] === 'definitions');
	const schemaPath = !hasSchema ? [] : path.slice(schemaIndex);
	const pathWithoutProperties = (hasSchema ? path.slice(0, schemaIndex) : path).filter(item => item !== 'properties');
	const bucketWithRequest = isComponents ? ['components'] : pathWithoutProperties.slice(0,2);
	const parentElementName = isComponents ? 'components' : 'paths';
	if (pathWithoutProperties[3] !== 'response') {
		if (pathWithoutProperties[2] !== 'requestBody') {
			if (isComponents) {
				return { $ref: `${pathToFile}#/${parentElementName}/${[ ...pathWithoutProperties.slice(2), ...schemaPath].join('/')}` };
			}

			return { $ref: `${pathToFile}#/${parentElementName}/${[ ...pathWithoutProperties , ...schemaPath].join('/')}` };
		}

		return { $ref: `${pathToFile}#/${parentElementName}/${[ ...bucketWithRequest, 'requestBody', 'content', ...pathWithoutProperties.slice(3), ...schemaPath].join('/')}` };
	}

	const response = pathWithoutProperties[2];
	const pathToItem = pathWithoutProperties.slice(4)

	const pathWithResponses = [ ...bucketWithRequest, 'responses', response, ...pathToItem, ...schemaPath ];

	return { $ref: `${pathToFile}#/paths/${pathWithResponses.join('/')}` };
};

function hasRef(data = {}) {
	return data.$ref ? true : false;
}

function getArrayItemsType(items) {
	if (Array.isArray(items)) {
		return Object.assign({}, items.length > 0 ? getType(items[0]) : {});
	}
	return Object.assign({}, items ? getType(items) : {});
}

function getObjectProperties(properties) {
	if (!properties) {
		return;
	}
	return Object.keys(properties).reduce((acc, propName) => {
		acc[propName] = getType(properties[propName], propName);
		return acc;
	}, {});
}

function getXml(data) {
	if (!data) {
		return undefined;
	}

	return Object.assign({}, {
		name: data.xmlName,
		namespace: data.xmlNamespace,
		prefix: data.xmlPrefix,
		attribute: data.xmlAttribute,
		wrapped: data.xmlWrapped
	}, getExtensions(data.scopesExtensions));
}

function getPrimitiveTypeProps(data) {
	const properties = {
		type: data.type,
		format: data.format || data.mode,
		description: data.description,
		exclusiveMinimum: data.exclusiveMinimum,
		exclusiveMaximum: data.exclusiveMaximum,
		minimum: data.minimum,
		maximum: data.maximum,
		enum: data.enum,
		pattern: data.pattern,
		default: data.default,
		minLength: data.minLength,
		maxLength: data.maxLength,
		multipleOf: data.multipleOf,
		xml: getXml(data.xml),
		example: data.sample,
		...getExtensions(data.scopesExtensions)
	};

	return addIfTrue(properties, 'nullable', data.nullable);
}

function getAdditionalProperties(data) {
	const getAdditionalPropsObject = (data) => {
		if (!data) {
			return;
		}
		if (data.additionalPropertiesObjectType === 'integer') {
			return {
				type: data.additionalPropertiesObjectType,
				format: data.additionalPropertiesIntegerFormat
			}
		}
		return { type: data.additionalPropertiesObjectType };
	}

	if (!data.additionalPropControl) {
		return;
	}
	
	if (data.additionalPropControl === 'Boolean') {
		return data.additionalProperties || undefined;
	}
	
	return getAdditionalPropsObject(data);
}

function getChoices(data, key) {
	const mapChoice = (item, key) => {
		const choiceValue = get(item, `properties.${key}`); 
		if (choiceValue) {
			return getType(choiceValue);
		}
		return getType(item);
	}

	if (!data) {
		return;
	}
	const { allOf, anyOf, oneOf, not } = data;
	const multipleChoices = ['allOf', 'anyOf', 'oneOf', 'not'];

	return multipleChoices.reduce((acc, choice) => {
		if (acc[choice]) {
			if (choice === 'not') {
				acc[choice] = mapChoice(acc[choice], key);
			} else {
				acc[choice] = acc[choice].map(item => mapChoice(item, key)); 
			}
		}
		return acc;
	}, { allOf, anyOf, oneOf, not });
}

function hasChoice(data) {
	if (!data) {
		return false;
	}
	if (data.allOf || data.anyOf || data.oneOf || data.not) {
		return true;
	}
	return false;
}

function parseExample(data) {
	try {
		return JSON.parse(data);
	} catch(err) {
		return data;
	}
}

function addIfTrue(data, propertyName, value) {
	if (!value) {
		return data;
	}

	return Object.assign({}, data, {
		[propertyName]: value
	});
}

module.exports = {
	getType,
	getRef,
	hasRef,
	hasChoice
};