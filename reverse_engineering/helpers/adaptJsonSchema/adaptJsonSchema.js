const mapJsonSchema = require('./mapJsonSchema');

const convertToString = (jsonSchema) => {
	return Object.assign({}, jsonSchema, {
		type: 'string',
		nullable: true
	});
};

const adaptJsonSchema = (jsonSchema) => {
	return mapJsonSchema(jsonSchema, (jsonSchemaItem) => {
		if (jsonSchemaItem.type !== 'null') {
			return jsonSchemaItem;
		}

		return convertToString(jsonSchemaItem);
	});
};

module.exports = adaptJsonSchema;
