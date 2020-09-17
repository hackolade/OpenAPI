const get = require('lodash.get');
const { getContent } = require('./parametersHelper');
const getExtensions = require('../extensionsHelper');
const { getRef, hasRef } = require('../typeHelper');
const { commentDeactivatedItemInner } = require('../commentsHelper');
const { activateItem } = require('../commonHelper');

function getRequestBodies(data) {
	if (!data || !data.properties) {
		return;
    }
    
    return Object.entries(data.properties)
        .map(([key, value]) => {
            return {
                key,
                value: mapRequestBody(activateItem(value), get(data, 'required', []).includes(key), true)
            };
        })
        .reduce((acc, { key, value }) => {
            acc[key] = value;
            return acc;
        }, {});
}

function mapRequestBody(data, required, isParentActivated = false) {
    if (!data) {
        return;
    }
    if (hasRef(data)) {
		return commentDeactivatedItemInner(getRef(data), data.isActivated, isParentActivated);
	}

    const content = getContent(data, data.isActivated && isParentActivated);
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

    return commentDeactivatedItemInner(Object.assign({}, requestBody, extensions), data.isActivated, isParentActivated);
}

module.exports = {
    getRequestBodies,
    mapRequestBody
};