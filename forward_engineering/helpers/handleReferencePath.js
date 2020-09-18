
const mapJsonSchema = require('../../reverse_engineering/helpers/adaptJsonSchema/mapJsonSchema');

const COMPONENTS_SCHEMAS_OBJECT_INDEX = 2;
const REQUEST_BODY_OBJECT_INDEX = 2;
const RESPONSE_NAME_INDEX = 2;
const RESPONSE_OBJECT_INDEX = 3;
const PATH_START_INDEX = 4;

const { prepareReferenceName } = require('../utils/utils');

const handleReferencePath = (externalDefinitions, { $ref: ref }) => {
	if (ref.startsWith('#')) {
		ref = ref.replace('#model/definitions', '#/components');

		return { $ref: prepareReferenceName(ref) };
	}

	const [ pathToFile, relativePath] = ref.split('#/');
	if (!relativePath) {
		return { $ref: prepareReferenceName(ref) };
	}

	const externalDefinition = findExternalDefinition(externalDefinitions, pathToFile, relativePath);
	if (!externalDefinition) {
		return { $ref: prepareReferenceName(ref) };
	}

	if (externalDefinition.fileType === 'targetSchema') {
		return { $ref: updateOpenApiPath(pathToFile, relativePath) };
	} else if (externalDefinition.fileType === 'hackoladeSchema') {
		return mapJsonSchema(externalDefinition, field => {
			if (!field.$ref || field.type === 'reference') {
				return field;
			}

			const definition = { ...field };
			delete definition.$ref;

			return definition;
		});
	}  else if (externalDefinition.fileType === 'jsonSchema') {
		return { $ref: fixJsonSchemaPath(pathToFile, relativePath) };;
	}

	return  { $ref: prepareReferenceName(ref) };
};

const fixJsonSchemaPath = (pathToFile, relativePath) => {
	const namePath = relativePath.split('/');
	if (['properties', 'items'].includes(namePath[0])) {
		return `${pathToFile}#/${relativePath}`;
	}

	return `${pathToFile}#/${namePath.slice(1).join('/')}`; 
};

const findExternalDefinition = (externalDefinitions, pathToFile, relativePath) => {
	pathToFile = pathToFile.replace('file://', '');

	const definitionName = Object.keys(externalDefinitions).find(name => {
		const definition = externalDefinitions[name];
		return (
			definition.fieldRelativePath === '#/' + relativePath && 
			definition.link === pathToFile
		);
	});

	return externalDefinitions[definitionName];
};

const updateOpenApiPath = (pathToFile, relativePath) => {
	let path = relativePath.split('/');
	if (path[0] === 'definitions') {
		if (path[COMPONENTS_SCHEMAS_OBJECT_INDEX] === 'schemas') {
			return `${pathToFile}#/components/schemas/${path.slice(PATH_START_INDEX).join('/')}`;
		}

		path = ['', ...path];
	}

	const schemaIndex = path.indexOf('schema');
	const hasSchema = schemaIndex !== -1;
	const isComponents = (path[1] === 'definitions');
	const schemaPath = !hasSchema ? [] : path.slice(schemaIndex);
	const pathWithoutProperties = (hasSchema ? path.slice(0, schemaIndex) : path).filter(item => item !== 'properties');
	const bucketWithRequest = isComponents ? ['components'] : pathWithoutProperties.slice(0,2);
	const parentElementName = isComponents ? 'components' : 'paths';
	const isResponse = pathWithoutProperties[RESPONSE_OBJECT_INDEX] === 'response';
	const isRequestBody = pathWithoutProperties[REQUEST_BODY_OBJECT_INDEX] === 'requestBody'

	if (!isResponse) {
		if (!isRequestBody) {
			if (isComponents) {
				return `${pathToFile}#/${parentElementName}/${[ ...pathWithoutProperties.slice(2), ...schemaPath].join('/')}`;
			}

			return `${pathToFile}#/${parentElementName}/${[ ...pathWithoutProperties , ...schemaPath].join('/')}`;
		}

		return `${pathToFile}#/${parentElementName}/${[ ...bucketWithRequest, 'requestBody', 'content', ...pathWithoutProperties.slice(3), ...schemaPath].join('/')}`;
	}

	const response = pathWithoutProperties[RESPONSE_NAME_INDEX];
	const pathToItem = pathWithoutProperties.slice(PATH_START_INDEX)

	const pathWithResponses = [ ...bucketWithRequest, 'responses', response, ...pathToItem, ...schemaPath ];

	return `${pathToFile}#/paths/${pathWithResponses.join('/')}`;
};

module.exports = handleReferencePath;
