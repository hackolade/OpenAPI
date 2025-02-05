const yaml = require('js-yaml');
const { get } = require('lodash');
const getInfo = require('./infoHelper');
const { getPaths } = require('./pathHelper');
const getComponents = require('./componentsHelpers');
const commonHelper = require('./commonHelper');
const { getServers } = require('./serversHelper');
const getExtensions = require('./extensionsHelper');
const handleReferencePath = require('./handleReferencePath');
const mapJsonSchema = require('../../reverse_engineering/helpers/adaptJsonSchema/mapJsonSchema');
const versions = require('../../package.json').contributes.target.versions;
const { addCommentsSigns, removeCommentLines } = require('./commentsHelper');

const handleRef = (externalDefinitions, resolveApiExternalRefs) => field => {
	if (!field.$ref) {
		return field;
	}
	const ref = handleReferencePath(externalDefinitions, field, resolveApiExternalRefs);
	if (!ref.$ref) {
		return ref;
	}

	return { ...field, ...ref };
};

const handleRefInContainers = (containers, externalDefinitions, resolveApiExternalRefs) => {
	return containers.map(container => {
		try {
			const updatedSchemas = Object.keys(container.jsonSchema).reduce((schemas, id) => {
				const json = container.jsonSchema[id];
				try {
					const updatedSchema = mapJsonSchema(
						JSON.parse(json),
						handleRef(externalDefinitions, resolveApiExternalRefs),
					);

					return {
						...schemas,
						[id]: JSON.stringify(updatedSchema),
					};
				} catch (err) {
					return { ...schemas, [id]: json };
				}
			}, {});

			return {
				...container,
				jsonSchema: updatedSchemas,
			};
		} catch (err) {
			return container;
		}
	});
};

const separatePathAndWebhooks = containers => {
	const pathContainers = [];
	const webhookContainers = [];

	containers.forEach(container => {
		if (container.containerData?.[0]?.webhook) {
			webhookContainers.push(container);
		} else {
			pathContainers.push(container);
		}
	});

	return { pathContainers, webhookContainers };
};

function generateModelScript(data, logger, cb) {
	try {
		const {
			dbVersion,
			externalDocs: modelExternalDocs,
			tags: modelTags,
			security: modelSecurity,
			servers: modelServers,
			jsonSchemaDialect,
		} = data.modelData[0];
		const apiTargetVersion = data?.options?.apiTargetVersion;
		const specVersion = apiTargetVersion && versions.includes(apiTargetVersion) ? apiTargetVersion : dbVersion;

		const containersIdsFromCallbacks = commonHelper.getContainersIdsForCallbacks(data);

		const resolveApiExternalRefs = data.options?.additionalOptions?.find(
			option => option.id === 'resolveApiExternalRefs',
		)?.value;

		const info = getInfo(data.modelData[0]);
		const servers = getServers(modelServers);
		const externalDefinitions = JSON.parse(data.externalDefinitions || '{}').properties || {};
		const containers = handleRefInContainers(data.containers, externalDefinitions, resolveApiExternalRefs);
		const { pathContainers, webhookContainers } = separatePathAndWebhooks(containers);
		const paths = getPaths(pathContainers, containersIdsFromCallbacks, specVersion);
		const webhooks = getPaths(webhookContainers, containersIdsFromCallbacks, specVersion);
		const definitions = JSON.parse(data.modelDefinitions) || {};
		const definitionsWithHandledReferences = mapJsonSchema(
			definitions,
			handleRef(externalDefinitions, resolveApiExternalRefs),
		);
		const components = getComponents({
			definitions: definitionsWithHandledReferences,
			containers: data.containers,
			specVersion,
		});
		const security = commonHelper.mapSecurity(modelSecurity);
		const tags = commonHelper.mapTags(modelTags);
		const externalDocs = commonHelper.mapExternalDocs(modelExternalDocs);

		const openApiSchema = {
			openapi: specVersion,
			info,
			...(jsonSchemaDialect && { jsonSchemaDialect }),
			servers,
			paths,
			...(webhooks && Object.keys(webhooks).length ? { webhooks } : {}),
			components,
			security,
			tags,
			externalDocs,
		};
		const extensions = getExtensions(data.modelData[0].scopesExtensions);

		const resultSchema = { ...openApiSchema, ...extensions };

		switch (data.targetScriptOptions.format) {
			case 'yaml': {
				const schema = yaml.safeDump(resultSchema, { skipInvalid: true });
				const schemaWithComments = addCommentsSigns(schema, 'yaml');
				cb(null, schemaWithComments);
				break;
			}
			case 'json':
			default: {
				const schemaString = JSON.stringify(resultSchema, null, 2);
				let schema = addCommentsSigns(schemaString, 'json');
				if (!get(data, 'options.isCalledFromFETab')) {
					schema = removeCommentLines(schema);
				}
				cb(null, schema);
			}
		}
	} catch (err) {
		logger.log('error', { error: err }, 'OpenAPI FE Error');
		cb(err);
	}
}

module.exports = {
	generateModelScript,
};
