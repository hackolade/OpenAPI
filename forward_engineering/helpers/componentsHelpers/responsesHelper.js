const get = require('lodash.get');
const { getLinks } = require('./linksHelper');
const { getHeaders, getContent } = require('./parametersHelper');
const getExtensions = require('../extensionsHelper');
const { getRef, hasRef } = require('../typeHelper');

function getResponses(data, specVersion) {
	if (!data || !data.properties) {
		return;
	}

	return Object.entries(data.properties)
		.map(([key, value]) => {
			return {
				key,
				value: mapResponse({ data: value, specVersion }),
			};
		})
		.reduce((acc, { key, value }) => {
			acc[key] = value;
			return acc;
		}, {});
}

function mapResponse({ data, responseCollectionDescription, shouldResponseBeCommented = false, specVersion }) {
	if (!data) {
		return;
	}
	if (hasRef(data)) {
		return getRef(data, specVersion);
	}
	const description = data.description || responseCollectionDescription || '';
	const headers = getHeaders({
		data: get(data, `properties.headers`),
		isParentActivated: !shouldResponseBeCommented,
		specVersion,
	});
	const content = getContent({
		data: get(data, `properties.content`),
		isParentActivated: !shouldResponseBeCommented,
		specVersion,
	});
	const links = getLinks(get(data, `properties.links`), specVersion);
	const extensions = getExtensions(data.scopesExtensions);
	const response = {};
	if (shouldResponseBeCommented) {
		response[`hackoladeInnerCommentStart`] = true;
	}

	Object.assign(response, { description, headers, content, links }, extensions);

	if (shouldResponseBeCommented) {
		response[`hackoladeInnerCommentEnd`] = true;
	}

	return response;
}

module.exports = {
	getResponses,
	mapResponse,
};
