const mapJsonSchema = require('./mapJsonSchema');

const convertToString = (jsonSchema) => {
	return Object.assign({}, jsonSchema, {
		type: 'string',
		nullable: true
	});
};

const convertMultipleTypeToType = jsonSchema => {
	const type = jsonSchema.type.find(item => item !== 'null');
	
	if (!type) {
		return convertToString(jsonSchema);
	} else if (!jsonSchema.type.includes('null')) {
		return {
			...jsonSchema,
			type
		}
	} 

	return {
		...jsonSchema,
		type,
		nullable: true
	}
}

const handleNumericType = (jsonSchema) => {
	if (jsonSchema.mode === 'int') {
		return {
			...jsonSchema,
			type: 'integer'
		}
	}
	if (jsonSchema.mode === 'decimal') {
		return {
			...jsonSchema,
			type: 'number',
			mode: 'double'
		}
	}

	return jsonSchema;
};

const adaptJsonSchema = (jsonSchema, targetDBVersion) => {
	const isJSONSchemaCompatibleTargetVersion = targetDBVersion?.split('.')?.[1] >= '1'; // 3.1.0 or higher
	return mapJsonSchema(jsonSchema, (jsonSchemaItem) => {
		if (Array.isArray(jsonSchemaItem.type) && !isJSONSchemaCompatibleTargetVersion) {
			return convertMultipleTypeToType(jsonSchemaItem);
		} else if (jsonSchemaItem.type === 'number') {
			return handleNumericType(jsonSchemaItem);
		} else if (jsonSchemaItem.type === 'null' && !isJSONSchemaCompatibleTargetVersion) {
			return convertToString(jsonSchemaItem);
		}
		
		return jsonSchemaItem;
	});
};

module.exports = adaptJsonSchema;
