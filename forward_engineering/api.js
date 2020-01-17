const yaml = require('js-yaml');
const get = require('lodash.get');
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
	},

	validate(data, logger, cb) {
		const { script, targetScriptOptions } = data;
		try {
			const filteredScript = removeCommentLines(script);
			let parsedScript = {};

			switch (targetScriptOptions.format) {
				case 'yaml':
					parsedScript = yaml.safeLoad(filteredScript);
					break;
				case 'json':
				default:
					parsedScript = JSON.parse(filteredScript);
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

const addCommentsSigns = (string, format) => {
	const commentsStart = /hackoladeCommentStart\d+/i;
	const commentsEnd = /hackoladeCommentEnd\d+/i;
	const innerCommentStart = /hackoladeInnerCommentStart/i;
	const innerCommentEnd = /hackoladeInnerCommentEnd/i;
	
	const { result } = string.split('\n').reduce(({ isCommented, result }, line, index, array) => {
		if (commentsStart.test(line) || innerCommentStart.test(line)) {
			return { isCommented: true, result: result };
		}
		if (commentsEnd.test(line)) {
			return { isCommented: false, result };
		}
		if (innerCommentEnd.test(line)) {
			if (format === 'json') {
				array[index + 1] = '# ' + array[index + 1];
			}
			return { isCommented: false, result };
		}

		const isNextLineInnerCommentStart = index + 1 < array.length && innerCommentStart.test(array[index + 1]);
		if (isCommented || isNextLineInnerCommentStart) {
			result = result + '# ' + line + '\n';
		} else {
			result = result + line + '\n';
		}

		return { isCommented, result };
	}, { isCommented: false, result: '' });

	return result;
}

const removeCommentLines = (scriptString) => {
	const isCommentedLine = /^\s*#\s+/i;

	return scriptString
		.split('\n')
		.filter(line => !isCommentedLine.test(line))
		.join('\n')
		.replace(/(.*?),\s*(\}|])/g, '$1$2');
}
