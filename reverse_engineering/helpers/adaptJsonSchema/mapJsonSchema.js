const isPlainObject = require('lodash.isplainobject');
const partial = require('lodash.partial');

const add = (obj, properties) => Object.assign({}, obj, properties);

const mapJsonSchema = (jsonSchema, callback) => {
	const mapProperties = (properties, mapper) => Object.keys(properties).reduce((newProperties, propertyName) => {
		return add(newProperties, {
			[propertyName]: mapper(properties[propertyName])
		});
	}, {});
	const mapItems = (items, mapper) => {
		if (Array.isArray(items)) {
			return items.map(jsonSchema => mapper(jsonSchema));
		} else if (isPlainObject(items)) {
			return mapper(items);
		} else {
			return items;
		}
	};
	const applyTo = (properties, jsonSchema, mapper) => {
		return properties.reduce((jsonSchema, propertyName) => {
			if (!jsonSchema[propertyName]) {
				return jsonSchema;
			}
	
			return Object.assign({}, jsonSchema, {
				[propertyName]: mapper(jsonSchema[propertyName])
			});
		}, jsonSchema);
	};
	if (!isPlainObject(jsonSchema)) {
		return jsonSchema;
	}
	const mapper = partial(mapJsonSchema, partial.placeholder, callback);
	const propertiesLike = [ 'properties', 'definitions', 'patternProperties' ];
	const itemsLike = [ 'items', 'oneOf', 'allOf', 'anyOf', 'not' ];
	
	const copyJsonSchema = Object.assign({}, jsonSchema);
	const jsonSchemaWithNewProperties = applyTo(propertiesLike, copyJsonSchema, partial(mapProperties, partial.placeholder, mapper));
	const newJsonSchema = applyTo(itemsLike, jsonSchemaWithNewProperties, partial(mapItems, partial.placeholder, mapper));

	return callback(newJsonSchema);
};

module.exports = mapJsonSchema;
