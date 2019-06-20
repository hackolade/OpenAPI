const yaml = require('js-yaml');
const validationHelper = require('./helpers/validationHelper');
const getInfo = require('./helpers/infoHelper');
const { getPaths } = require('./helpers/pathHelper');
const getComponents = require('./helpers/componentsHelpers');
const commonHelper = require('./helpers/commonHelper');
const { getServers } = require('./helpers/serversHelper');
const getExtensions = require('./helpers/extensionsHelper');

module.exports = {
	generateModelScript(data, logger, cb) {
		try {
			const {
				dbVersion,
				externalDocs: modelExternalDocs,
				tags: modelTags,
				security: modelSecurity,
				servers: modelServers
			} = data.modelData[0];

			const containersIdsFromCallbacks = commonHelper.getContainersIdsForCallbacks(data);

			const info = getInfo(data.modelData[0]);
			const servers = getServers(modelServers);
			const paths = getPaths(data.containers, containersIdsFromCallbacks);
			const components = getComponents(data);
			const security = commonHelper.mapSecurity(modelSecurity);
			const tags = commonHelper.mapTags(modelTags);
			const externalDocs = commonHelper.mapExternalDocs(modelExternalDocs);

			const openApiSchema = {
				openapi: dbVersion,
				info,
				servers,
				paths,
				components,
				security,
				tags,
				externalDocs
			};
			const extensions = getExtensions(data.modelData[0].scopesExtensions);

			const resultSchema = Object.assign({}, openApiSchema, extensions);

			switch (data.targetScriptOptions.format) {
				case 'yaml':
					cb(null, yaml.safeDump(resultSchema, { skipInvalid: true }));
					break;
				case 'json':
				default:
					cb(null, JSON.stringify(resultSchema, null, 2));
			}
		} catch (err) {
			logger.log('error', { error: err }, 'OpenAPI FE Error');
			cb(err);
		}
	},

	validate(data, logger, cb) {
		const { script, targetScriptOptions } = data;

		try {
			let parsedScript = {};

			switch (targetScriptOptions.format) {
				case 'yaml':
					parsedScript = yaml.safeLoad(script);
					break;
				case 'json':
				default:
					parsedScript = JSON.parse(script);
			}

			validationHelper.validate(parsedScript)
				.then((messages) => {
					cb(null, messages);
				})
				.catch(err => {
					cb(err.message);
				});
		} catch (e) {
			logger.log('error', { error: e }, 'OpenAPI Validation Error');

			cb(e.message);
		}
	}
};
