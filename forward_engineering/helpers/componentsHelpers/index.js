const get = require('lodash.get');
const { getSchemas } = require('./schemasHelper');
const { getRequestBodies } = require('./requestBodiesHelper');
const { getResponses } = require('./responsesHelper');
const { getParameters, getHeaders, prepareHeadersComponents } = require('./parametersHelper');
const { getSecuritySchemes } = require('./securitySchemesHelper');
const { getExamples } = require('./examplesHelper');
const { getLinks } = require('./linksHelper');
const { getCallbacks } = require('../pathHelper');
const getExtensions = require('../extensionsHelper');
const { prepareName } = require('../../utils/utils');

const renameComponents = (components) => {
    if (!components) {
        return components;
    }

    return Object.keys(components).reduce((result, componentName) => {
        return Object.assign({}, result, {
            [prepareName(componentName)]: components[componentName]
        });
    }, {});
};

function getComponents(definitions, containers) {
    const componentsData = get(definitions, 'properties', {});

    const schemas = renameComponents(getSchemas(componentsData.schemas));
    const responses = renameComponents(getResponses(componentsData.responses));
    const parameters = renameComponents(getParameters(componentsData.parameters));
    const examples = renameComponents(getExamples(componentsData.examples));
    const requestBodies = renameComponents(getRequestBodies(componentsData.requestBodies));
    const headers = renameComponents(getHeaders(prepareHeadersComponents(componentsData.headers), true));
    const securitySchemes = renameComponents(getSecuritySchemes(componentsData.securitySchemes));
    const links = renameComponents(getLinks(componentsData.links));
    const callbacks = renameComponents(getCallbacks(componentsData.callbacks, containers));

    const extensions = getExtensions(get(componentsData, `['Specification Extensions'].scopesExtensions`));

    return Object.assign(
        {}, 
        {
            schemas,
            responses,
            parameters,
            examples,
            requestBodies,
            headers,
            securitySchemes,
            links,
            callbacks
        },
        extensions
    );
}

module.exports = getComponents;