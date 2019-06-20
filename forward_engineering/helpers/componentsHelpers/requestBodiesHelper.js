const get = require('lodash.get');
const { getContent } = require('./parametersHelper');
const getExtensions = require('../extensionsHelper');
const { getRef, hasRef } = require('../typeHelper');

function getRequestBodies(data) {
	if (!data || !data.properties) {
		return;
    }
    
    return Object.entries(data.properties)
        .map(([key, value]) => {
            return {
                key,
                value: mapRequestBody(value, get(data, 'required', []).includes(key))
            };
        })
        .reduce((acc, { key, value }) => {
            acc[key] = value;
            return acc;
        }, {});
}

function mapRequestBody(data, required) {
    if (!data) {
        return;
    }
    if (hasRef(data)) {
		return getRef(data);
	}

    const content = getContent(data);
    if (!content) {
        return;
    }
    const description = data.description;
    const requestBody = {
        description,
        content,
        required: required || undefined
    }
    const extensions = getExtensions(data.scopesExtensions);

    return Object.assign({}, requestBody, extensions);
}

module.exports = {
    getRequestBodies,
    mapRequestBody
};