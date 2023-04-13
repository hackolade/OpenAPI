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

function getComponents({ definitions, containers, specVersion }) {
    const componentsData = get(definitions, 'properties', {});

    const schemas = renameComponents(getSchemas(componentsData.schemas, specVersion));
    const responses = renameComponents(getResponses(componentsData.responses, specVersion));
    const parameters = renameComponents(getParameters(componentsData.parameters, specVersion));
    const examples = renameComponents(getExamples(componentsData.examples, specVersion));
    const requestBodies = renameComponents(getRequestBodies(componentsData.requestBodies, specVersion));
    const headers = renameComponents(getHeaders({ data: prepareHeadersComponents(componentsData.headers), isParentActivated: true, specVersion }));
    const securitySchemes = renameComponents(getSecuritySchemes(componentsData.securitySchemes, specVersion));
    const links = renameComponents(getLinks(componentsData.links, specVersion));
    const callbacks = renameComponents(getCallbacks({ data: componentsData.callbacks, containers, specVersion }));

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