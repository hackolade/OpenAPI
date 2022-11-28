const get = require('lodash.get');
const getExtensions = require('./extensionsHelper');
const { prepareReferenceName } = require('../utils/utils');
const { commentDeactivatedItemInner } = require('./commentsHelper');

function getType(data, key, isParentActivated = false) {
	if (!data) {
		return;
	}

	if (Array.isArray(data.type)) {
		return getType(Object.assign({}, data, { type: data.type[0] }), '', isParentActivated);
	}

	if (hasRef(data)) {
		return commentDeactivatedItemInner(getRef(data), data.isActivated, isParentActivated);
	}
	
	return commentDeactivatedItemInner(getTypeProps(data, key, isParentActivated), data.isActivated, isParentActivated);
}

function getTypeProps(data, key, isParentActivated) {
	const { type, properties, items, required, isActivated } = data;

    const extensions = getExtensions(data.scopesExtensions);

	switch (type) {
		case 'array': {
			const arrayProps = {
				type,
				title: data.title || undefined,
				description: data.description || undefined,
				items: getArrayItemsType(items, isActivated && isParentActivated),
				collectionFormat: data.collectionFormat,
				minItems: data.minItems,
				maxItems: data.maxItems,
				uniqueItems: data.uniqueItems || undefined,
				nullable: data.nullable,
				discriminator: data.discriminator,
				readOnly: data.readOnly,
				example: parseExample(data.sample) || getArrayItemsExample(items),
				xml: getXml(data.xml)
			};
			const arrayChoices = getChoices(data, key);

			return Object.assign({}, arrayProps, arrayChoices, extensions);
		}
		case 'object': {
			const objectProps = {
				type,
				title: data.title || undefined,
				description: data.description || undefined,
				required: required || undefined,
				properties: getObjectProperties(properties, isActivated && isParentActivated),
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
			return getType(properties[Object.keys(properties)[0]], '', isActivated && isParentActivated);
		default:
			return getPrimitiveTypeProps(data);
	}
}

function getRef({ $ref }) {
	return { $ref };
};

function hasRef(data = {}) {
	return data.$ref ? true : false;
}

function getArrayItemsType(items, isParentActivated) {
	if (Array.isArray(items)) {
		return Object.assign({}, items.length > 0 ? getType(items[0], '', isParentActivated) : {});
	}
	return Object.assign({}, items ? getType(items, '', isParentActivated) : {});
}

function getObjectProperties(properties, isParentActivated) {
	if (!properties) {
		return;
	}

	return Object.keys(properties).reduce((acc, propName) => {
		acc[propName] = commentDeactivatedItemInner(
			getType(properties[propName], propName, isParentActivated),
			properties[propName].isActivated,
			isParentActivated
		);
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
		title: data.title || undefined,
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

function getArrayItemsExample(items) {
	const supportedDataTypes = ['object', 'string', 'number', 'integer', 'boolean'];
	if (Array.isArray(items) && items.length > 1) {
		const itemsExample = items.filter(item => item.isActivated !== false).reduce((acc, item) => {
			if (supportedDataTypes.includes(item.type) && item.sample) {
				const example = item.type === 'object' ? parseExample(item.sample) : item.sample;
				return acc.concat(example);
			}
			return acc;
		}, []);
		if (itemsExample.length > 1) {
			return itemsExample;
		}
	}
}

module.exports = {
	getType,
	getRef,
	hasRef,
	hasChoice
};