const get = require('lodash.get');
const { getContent } = require('./parametersHelper');
const getExtensions = require('../extensionsHelper');
const { getRef, hasRef } = require('../typeHelper');
const { commentDeactivatedItemInner } = require('../commentsHelper');
const { activateItem } = require('../commonHelper');

function getRequestBodies(data, specVersion) {
	if (!data || !data.properties) {
		return;
    }
    
    return Object.entries(data.properties)
        .map(([key, value]) => {
            return {
                key,
                value: mapRequestBody({ data: activateItem(value), required: get(data, 'required', []).includes(key), isParentActivated: true, specVersion }),
            };
        })
        .reduce((acc, { key, value }) => {
            acc[key] = value;
            return acc;
        }, {});
}

function mapRequestBody({ data, required, isParentActivated = false, specVersion }) {
    if (!data) {
        return;
    }
    if (hasRef(data)) {
		return commentDeactivatedItemInner(getRef(data, specVersion), data.isActivated, isParentActivated);
	}

    const content = getContent({ data, isParentActivated: data.isActivated && isParentActivated, specVersion });
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