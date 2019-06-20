const get = require('lodash.get');
const { getRef, hasRef } = require('../typeHelper');
const getExtensions = require('../extensionsHelper');
const { mapServer } = require('../serversHelper');

function getLinks(data) {
    if (!data || !data.properties) {
		return;
	}

	return Object.entries(data.properties)
		.map(([key, value]) => {
			return {
				key,
				value: mapLink(value)
			};
		})
		.reduce((acc, { key, value }) => {
			acc[key] = value;
			return acc;
		}, {});
}

function mapLink(data) {
    if (!data) {
		return;
	} 
	if (hasRef(data)) {
		return getRef(data);
    }
    
    const { operationRef, operationId, description, server, scopesExtensions } = data;

    const parametersData = get(data, 'properties.parameters', {});
    const requestBodyData = get(data, 'properties.requestBody', {});

    if (!parametersData.properties && !requestBodyData.expression) {
        return;
    }

    const linkData = {
        operationRef: operationId ? undefined : operationRef,
        operationId,
        parameters: mapParameters(parametersData),
        requestBody: requestBodyData ? requestBodyData.expression : undefined,
        description,
        server: mapServer(server)
    };
    const extensions = getExtensions(scopesExtensions);

    return Object.assign({}, linkData, extensions);
}

function mapParameters(data) {
    if (!data) {
        return;
    }

    return Object.entries(data.properties)
    .map(([key, value]) => {
        return {
            key,
            value: value.expression
        };
    })
    .reduce((acc, { key, value }) => {
        acc[key] = value;
        return acc;
    }, {});
}

module.exports = {
    getLinks,
    mapLink
};