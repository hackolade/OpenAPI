'use strict'

const commonHelper = require('./helpers/commonHelper');
const dataHelper = require('./helpers/dataHelper');
const errorHelper = require('./helpers/errorHelper');
const adaptJsonSchema = require('./helpers/adaptJsonSchema/adaptJsonSchema');
const resolveExternalDefinitionPathHelper = require('./helpers/resolveExternalDefinitionPathHelper');
const validationHelper = require('../forward_engineering/helpers/validationHelper');

module.exports = {
	reFromFile(data, logger, callback) {
		logger.clear();
		commonHelper.getFileData(data.filePath).then(fileData => {
			return getOpenAPISchema(fileData, data.filePath);
		}).then(openAPISchema => {
			const fieldOrder = data.fieldInference.active;
			return Promise.all([
				handleOpenAPIData(openAPISchema, fieldOrder),
				validateSchema(openAPISchema),
			]);
		}).then(([reversedData, validationErrors]) => {
			let warning;

			if (Array.isArray(validationErrors) && validationErrors.length) {
				warning = {
					title: 'Anomalies were detected during reverse-engineering',
					message: "Review the log file for more details.",
					openLog: true,
				};
				logger.log('error', { validationErrors: validationErrors.map(prettifyValidationWarning) }, '[Warning] Invalid OpenAPI Schema');
			}

			return callback(null, reversedData.hackoladeData, { ...reversedData.modelData, warning }, [], 'multipleSchema');
		}, ({ error, openAPISchema }) => {
			if (!openAPISchema) {
				return this.handleErrors(error, logger, callback);
			}

			validationHelper.validate(filterSchema(openAPISchema), { resolve: { external: false }})
				.then((messages) => {
					if (!Array.isArray(messages) || !messages.length || (messages.length === 1 && messages[0].type === 'success')) {
						this.handleErrors(error, logger, callback);
					}

					const message = `${messages[0].label}: ${messages[0].title}`;
					const errorData = error.error || {};

					this.handleErrors(errorHelper.getValidationError({ stack: errorData.stack, message }), logger, callback);
				})
				.catch(err => {
					this.handleErrors(error, logger, callback);
				});
		}).catch(errorObject => {
			this.handleErrors(errorObject, logger, callback);
		});
	},

	handleErrors(errorObject, logger, callback) {
		const { error, title, name } = errorObject;
		const handledError =  commonHelper.handleErrorObject(error || errorObject, title || name);
		logger.log('error', handledError, title);
		callback(handledError);
	},

	adaptJsonSchema(data, logger, callback) {
		logger.log('info', 'Adaptation of JSON Schema started...', 'Adapt JSON Schema');
		try {
			const jsonSchema = JSON.parse(data.jsonSchema);

			const adaptedJsonSchema = adaptJsonSchema(jsonSchema);

			logger.log('info', 'Adaptation of JSON Schema finished.', 'Adapt JSON Schema');

			callback(null, {
				jsonSchema: JSON.stringify(adaptedJsonSchema)
			});
		} catch(e) {
			callback(commonHelper.handleErrorObject(e, 'Adapt JSON Schema'), data);
		}
	},

	resolveExternalDefinitionPath(data, logger, callback) {
		resolveExternalDefinitionPathHelper.resolvePath(data, callback);
	}
};

const validateSchema = async (openApiSchema) => {
	const messages = await validationHelper.validate(filterSchema(openApiSchema), { resolve: { external: false }}).catch(error => [{ message: error.message, stack: error.stack }]);

	return messages?.filter(error => error?.type !== 'success');
};

const prettifyValidationWarning = warning => {
	if (!warning?.context) {
		return warning;
	}

	const toString = (value) => {
		if (typeof value === 'object') {
			return JSON.stringify(warning.context);
		} else {
			return warning.context || '';
		}
	};

	return {
		...warning,
		context: '\n' + tab(toString(warning.context)).replace(/\t/gm, '  '),
	}
};

const tab = (text, tab = '        ') => text
	.split('\n')
	.map(line => tab + line)
	.join('\n');

const convertOpenAPISchemaToHackolade = (openAPISchema, fieldOrder) => {
	const modelData = dataHelper.getModelData(openAPISchema);
	const components = openAPISchema.components;
	const definitions = dataHelper.getComponents(openAPISchema.components, fieldOrder);
	const callbacksComponent = components && components.callbacks;
	const modelContent = dataHelper.getModelContent(openAPISchema.paths || {}, fieldOrder, callbacksComponent);
	return { modelData, modelContent, definitions };
};

const getOpenAPISchema = (data, filePath) => new Promise((resolve, reject) => {
	const { extension, fileName } = commonHelper.getPathData(data, filePath);

	try {
		const openAPISchemaWithModelName = dataHelper.getOpenAPIJsonSchema(data, fileName, extension);
		const isValidOpenAPISchema = dataHelper.validateOpenAPISchema(openAPISchemaWithModelName);

		if (isValidOpenAPISchema) {
			return resolve(openAPISchemaWithModelName);
		} else {
			return reject({ error: errorHelper.getValidationError(new Error('Selected file is not a valid OpenAPI 3.0.2 schema')) });
		}
	} catch (error) {
		return reject({ error: errorHelper.getParseError(error) });
	}
});

const handleOpenAPIData = (openAPISchema, fieldOrder) => new Promise((resolve, reject) => {
	try {
		const convertedData = convertOpenAPISchemaToHackolade(openAPISchema, fieldOrder);
		const { modelData, modelContent, definitions } = convertedData;
		const hackoladeData = modelContent.containers.reduce((accumulator, container) => {
			const currentEntities = modelContent.entities[container.name];
			return [
				...accumulator, 
				...currentEntities.map(entity => {
					const packageData = {
						objectNames: {
							collectionName: entity.collectionName
						},
						doc: {
							dbName: container.name,
							collectionName: entity.collectionName,
							modelDefinitions: definitions,
							bucketInfo: container
						},
						jsonSchema: JSON.stringify(entity)
					};
					return packageData;
				})
			];
		}, []);
		if (hackoladeData.length) {
			return resolve({ hackoladeData, modelData });
		}

		return resolve({
			hackoladeData: [{
				objectNames: {},
				doc: { modelDefinitions: definitions }
			}],
			modelData
		});
	} catch (error) {
		return reject({ error: errorHelper.getConvertError(error), openAPISchema });
	}
});

const filterSchema = schema => {
	delete schema.modelName;

	return schema;
};
