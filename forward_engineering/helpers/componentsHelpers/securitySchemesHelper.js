const getExtensions = require('../extensionsHelper');
const { getRef, hasRef } = require('../typeHelper');

function getSecuritySchemes(data) {
    if (!data || !data.properties) {
        return;
    }

    return Object.entries(data.properties)
        .map(([key, value]) => {
            return { key, value: mapSecurityScheme(value) };
        })
        .reduce((acc, { key, value }) => {
            acc[key] = value;
            return acc;
        }, {});
}

function mapSecurityScheme(data) {
    if (!data) {
		return;
	} 
	if (hasRef(data)) {
		return getRef(data);
    }
    
    let securitySchemeProps = {};
    switch (data.schemeType) {
        case 'apiKey':
            securitySchemeProps = {
                name: data.apiKeyName,
                in: data.in
            };
            break;
        case 'http':
            securitySchemeProps = {
                scheme: data.scheme,
                bearerFormat: data.bearerFormat
            };
            break;
        case 'oauth2':
            securitySchemeProps = {
                flows: mapOAuthFlows(data.flows)
            };
            break;
        case 'openIdConnect':
            securitySchemeProps = {
                openIdConnectUrl: data.openIdConnectUrl
            };
            break;
    }

    const commonFields = {
        type: data.schemeType,
        description: data.description
    };
    const extensions = getExtensions(data.scopesExtensions);

    return Object.assign({}, securitySchemeProps, commonFields, extensions);
}

function mapOAuthFlows(data) {
    if (!data) {
        return;
    }
    const flowsNames = ['implicit', 'password', 'clientCredentials', 'authorizationCode'];
    const flows = {};

    flowsNames.forEach(flowName => {
        if (data[flowName]) {
            flows[flowName] = mapOAuthFlowObject(data[flowName]);
        }
    });

    const extensions = getExtensions(data.scopesExtensions);

    return Object.assign({}, flows, extensions);
}

function mapOAuthFlowObject({ authorizationUrl, tokenUrl, refreshUrl, scopes, scopesExtensions }) {
    const flow = {
        authorizationUrl,
        tokenUrl,
        refreshUrl,
        scopes: mapScopes(scopes)
    };
    const extensions = getExtensions(scopesExtensions);

    return Object.assign({}, flow, extensions);
}

function mapScopes(data) {
    if (!data) return;
    return data
        .reduce((acc, { scopeName, scopeDescription }) => {
            acc[scopeName] = scopeDescription;
            return acc;
        }, {});
}

module.exports = {
    getSecuritySchemes,
    mapSecurityScheme
};