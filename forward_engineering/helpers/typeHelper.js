const get = require('lodash.get');
const getExtensions = require('./extensionsHelper');
const { prepareReferenceName } = require('../utils/utils');
const { commentDeactivatedItemInner } = require('./commentsHelper');
const { isTargetVersionJSONSchemaCompatible } = require('./sharedHelper');

const CONDITIONAL_ITEM_NAME = '<conditional>';

function getType({ data, key, isParentActivated = false, specVersion }) {
	if (!data) {
		return;
	}

	if (Array.isArray(data.type)) {
		if (isTargetVersionJSONSchemaCompatible(specVersion)) {
			return data.type.reduce((acc, type) => {
				const propsForType = getType({ data: { ...data, type }, key: '', isParentActivated, specVersion })
				acc = { ...propsForType, ...acc };
				return acc;
			}, { type: data.type });
		}
		return getType({ data: Object.assign({}, data, { type: data.type[0] }), key: '', isParentActivated, specVersion });
	}

	if (hasRef(data)) {
		return commentDeactivatedItemInner(getRef(data, specVersion), data.isActivated, isParentActivated);
	}
	
	return commentDeactivatedItemInner(getTypeProps({ data, key, isParentActivated, specVersion }), data.isActivated, isParentActivated);
}

function getTypeProps({ data, key, isParentActivated, specVersion }) {
	const { type, properties, items, required, isActivated } = data;

    const extensions = getExtensions(data.scopesExtensions);

	switch (type) {
		case 'array': {
			const arrayProps = {
				type,
				title: data.title || undefined,
				description: data.description || undefined,
				items: getArrayItemsType(items, isActivated && isParentActivated, specVersion),
				collectionFormat: data.collectionFormat,
				minItems: data.minItems,
				maxItems: data.maxItems,
				uniqueItems: data.uniqueItems || undefined,
				nullable: data.nullable,
				readOnly: data.readOnly || undefined,
				writeOnly: data.writeOnly || undefined,
				example: parseExample(data.sample) || getArrayItemsExample(items),
				xml: getXml(data.xml)
			};
			const arrayChoices = getChoices(data, key, specVersion);

			return Object.assign({}, arrayProps, arrayChoices, extensions);
		}
		case 'object': {
			const discriminator = getDiscriminator(data.discriminator);
			const objectProps = {
				type,
				title: data.title || undefined,
				description: data.description || undefined,
				required: required || undefined,
				properties: getObjectProperties(properties, isActivated && isParentActivated, specVersion),
				minProperties: data.minProperties,
				maxProperties: data.maxProperties,
				additionalProperties: getAdditionalProperties(data),
				nullable: data.nullable,
				...(discriminator ? { discriminator } : {}),
				readOnly: data.readOnly,
				example: parseExample(data.sample),
				xml: getXml(data.xml)
			};
			const objectChoices = getChoices(data, key, specVersion);
			const conditionalProperties = getConditionalProperties(data, specVersion);

			return Object.assign({}, objectProps, objectChoices, conditionalProperties, extensions);
		}
		case 'parameter':
			if (!properties || properties.length === 0) {
				return;
			}
			return getType({ data: properties[Object.keys(properties)[0]], key: '', isParentActivated: isActivated && isParentActivated, specVersion });
		default:
			return getPrimitiveTypeProps(data);
	}
}

function getRef({ $ref, refDescription, summary }, specVersion) {
	if (isTargetVersionJSONSchemaCompatible(specVersion)) {
		return { $ref, summary, description: refDescription }
	}
	return { $ref };
};

function hasRef(data = {}) {
	return data.$ref ? true : false;
}

function getArrayItemsType(items, isParentActivated, specVersion) {
	if (Array.isArray(items)) {
		return Object.assign({}, items.length > 0 ? getType({ data: items[0], key: '', isParentActivated, specVersion }) : {});
	}
	return Object.assign({}, items ? getType({ data: items, key: '', isParentActivated, specVersion }) : {});
}

function getObjectProperties(properties, isParentActivated, specVersion) {
	if (!properties) {
		return;
	}

	return Object.keys(properties).reduce((acc, propName) => {
		if (propName === CONDITIONAL_ITEM_NAME) {
			return acc;
		}
		acc[propName] = commentDeactivatedItemInner(
			getType({ data: properties[propName], key: propName, isParentActivated, specVersion }),
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

function getChoices(data, key, specVersion) {
	const mapChoice = (item, key, specVersion) => {
		const choiceValue = get(item, `properties.${key}`); 
		if (choiceValue) {
			return getType({ data: choiceValue, specVersion });
		}
		return getType({ data: item, specVersion });
	}

	if (!data) {
		return;
	}
	const { allOf, anyOf, oneOf, not } = data;
	const multipleChoices = ['allOf', 'anyOf', 'oneOf', 'not'];

	return multipleChoices.reduce((acc, choice) => {
		if (acc[choice]) {
			if (choice === 'not') {
				acc[choice] = mapChoice(acc[choice], key, specVersion);
			} else {
				acc[choice] = acc[choice].map(item => mapChoice(item, key, specVersion)); 
			}
		}
		return acc;
	}, { allOf, anyOf, oneOf, not });
}

function getConditionalProperties(data, specVersion) {
	if (!data) {
		return;
	}
	const conditionalProperties = get(data, `properties.${CONDITIONAL_ITEM_NAME}`);
	if (!conditionalProperties) {
		return;
	}
	return Object.keys(conditionalProperties.properties).reduce((acc, propName) => {
		const conditionalItem = getType({ data: { ...conditionalProperties.properties[propName], type: 'object' }, specVersion });
		if (!isConditionalItemEmpty(conditionalItem)) {
			acc[propName] = conditionalItem; 
		}
		return acc;
	}, {});
}

function isConditionalItemEmpty(data) {
	if (!data) {
		return true;
	}

	const { type, ...conditionalItemWithoutType } = data;
	return Object.values(conditionalItemWithoutType).filter(Boolean).length === 0;
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

function getDiscriminator(discriminator) {
	if (!discriminator || !discriminator.propertyName) {
		return null;
	}
	const mapping = (!discriminator.mapping || discriminator.mapping.length === 0) ? null : discriminator.mapping.reduce((acc, mappingItem) => {
		acc[mappingItem.discriminatorValue] = mappingItem.discriminatorSchema;
		return acc;
	}, {});

	return {
		propertyName: discriminator.propertyName,
		...(mapping && { mapping })

	};
}

module.exports = {
	getType, // TODO: fix get type arguments
	getRef,
	hasRef,
	hasChoice
};