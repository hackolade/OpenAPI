const yaml = require('js-yaml');
const get = require('lodash.get');
const validationHelper = require('./helpers/validationHelper');
const getInfo = require('./helpers/infoHelper');
const { getPaths } = require('./helpers/pathHelper');
const getComponents = require('./helpers/componentsHelpers');
const commonHelper = require('./helpers/commonHelper');
const { getServers } = require('./helpers/serversHelper');
const getExtensions = require('./helpers/extensionsHelper');
const handleReferencePath = require('./helpers/handleReferencePath');
const mapJsonSchema = require('../reverse_engineering/helpers/adaptJsonSchema/mapJsonSchema');
const path=require('path');

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
			const externalDefinitions = JSON.parse(data.externalDefinitions || '{}').properties || {};
			const containers = handleRefInContainers(data.containers, externalDefinitions);
			const paths = getPaths(containers, containersIdsFromCallbacks);
			const definitions = JSON.parse(data.modelDefinitions) || {};
			const definitionsWithHandledReferences = mapJsonSchema(definitions, handleRef(externalDefinitions));
			const components = getComponents(definitionsWithHandledReferences, data.containers);
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

			validationHelper.validate(replaceRelativePathByAbsolute(parsedScript, targetScriptOptions.modelDirectory))
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
	const innerCommentStartYamlArrayItem = /- hackoladeInnerCommentStart/i;
	
	const { result } = string.split('\n').reduce(({ isCommented, result }, line, index, array) => {
		if (commentsStart.test(line) || innerCommentStart.test(line)) {
			if (innerCommentStartYamlArrayItem.test(line)) {
				const lineBeginsAt = array[index + 1].search(/\S/);
				array[index + 1] = array[index + 1].slice(0, lineBeginsAt) + '- ' + array[index + 1].slice(lineBeginsAt);
			}
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
		if ((isCommented || isNextLineInnerCommentStart) && !innerCommentStartYamlArrayItem.test(array[index + 1])) {
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

const replaceRelativePathByAbsolute=(script, modelDirectory)=>{
    if(!modelDirectory || typeof modelDirectory !== 'string'){
        return script;
    }
    const stringifiedScript=JSON.stringify(script);
    const fixedScript= stringifiedScript.replace(/("\$ref":\s*)"(.*?(?<!\\))"/g, (match, refGroup, relativePath)=>{
        const isAbsolutePath=relativePath.startsWith('file:');
        const isInternetLink=relativePath.startsWith('http:') || relativePath.startsWith('https:');
        const isModelRef=relativePath.startsWith('#');
        if(isAbsolutePath || isInternetLink || isModelRef){
            return match
        }
        const absolutePath=path.join(path.dirname(modelDirectory), relativePath).replace(/\\/g, '/');
        return `${refGroup}"file://${absolutePath}"`
    });
    return JSON.parse(fixedScript);
}

const handleRefInContainers = (containers, externalDefinitions) => {
	return containers.map(container => {
		try {
			const updatedSchemas = Object.keys(container.jsonSchema).reduce((schemas, id) => {
				const json = container.jsonSchema[id];
				try {
					const updatedSchema = mapJsonSchema(JSON.parse(json), handleRef(externalDefinitions));

					return {
						...schemas,
						[id]: JSON.stringify(updatedSchema)
					};
				} catch (err) {
					return { ...schemas, [id]: json }
				}
			}, {});

			return {
				...container,
				jsonSchema: updatedSchemas
			};
		} catch (err) {
			return container;
		}
	});
};


const handleRef = externalDefinitions => field => {
	if (!field.$ref) {
		return field;
	}
	const ref = handleReferencePath(externalDefinitions, field);
	if (!ref.$ref) {
		return ref;
	}

	return { ...field, ...ref }; 
};
