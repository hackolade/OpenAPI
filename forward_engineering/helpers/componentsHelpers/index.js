const get = require('lodash.get');
const { getSchemas } = require('./schemasHelper');
const { getRequestBodies } = require('./requestBodiesHelper');
const { getResponses } = require('./responsesHelper');
const { getParameters, getHeaders } = require('./parametersHelper');
const { getSecuritySchemes } = require('./securitySchemesHelper');
const { getExamples } = require('./examplesHelper');
const { getLinks } = require('./linksHelper');
const { getCallbacks } = require('../pathHelper');


function getComponents(data) {
	const componentsData = get(JSON.parse(data.modelDefinitions), 'properties', {});

	const schemas = getSchemas(componentsData.schemas);
    const responses = getResponses(componentsData.responses);
    const parameters = getParameters(componentsData.parameters);
    const examples = getExamples(componentsData.examples);
    const requestBodies = getRequestBodies(componentsData.requestBodies);
    const headers = getHeaders(componentsData.headers);
    const securitySchemes = getSecuritySchemes(componentsData.securitySchemes);
    const links = getLinks(componentsData.links);
    const callbacks = getCallbacks(componentsData.callbacks, data.containers);

	return {
        schemas,
        responses,
        parameters,
        examples,
        requestBodies,
        headers,
        securitySchemes,
        links,
        callbacks
	};
}

module.exports = getComponents;