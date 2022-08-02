const getExtensions = require('../extensionsHelper');
const { getRef, hasRef } = require('../typeHelper');

const isEmpty = (item) => {
    if (!item) {
        return true;
    }

    if (Array.isArray(item)) {
        return item.length === 0;
    }

    if (typeof item === 'object') {
        return Object.keys(item).length === 0;
    }

    return false;
};

const cleanUp = (obj) => {
    if (typeof obj === 'object' && obj !== null) {
        return Object.keys(obj).reduce((acc, key) => {
            const value = cleanUp(obj[key]);
            if (isEmpty(value)) {
                return acc;
            }

            return Object.assign({}, acc, { [key]: value });
        }, {});
    }

    return obj;
};

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
            const flows = mapOAuthFlows(data.flows);

            securitySchemeProps = { flows };
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
    const flows = flowsNames.reduce((flows, flowName) => {
        let flow;
        if (data[flowName]) {
            flow = mapOAuthFlowObject(data[flowName]);
        }

        if (!isEmpty(flow)) {
            flows[flowName] = flow;
        }

        return flows;
    }, {});

    const extensions = getExtensions(data.scopesExtensions);

    return cleanUp(Object.assign({}, flows, extensions));
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