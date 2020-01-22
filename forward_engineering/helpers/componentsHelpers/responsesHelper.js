const get = require('lodash.get');
const { getLinks } = require('./linksHelper');
const { getHeaders, getContent } = require('./parametersHelper');
const getExtensions = require('../extensionsHelper');
const { getRef, hasRef } = require('../typeHelper');

function getResponses(data) {
	if (!data || !data.properties) {
		return;
	}

	return Object.entries(data.properties)
		.map(([key, value]) => {
			return {
				key,
				value: mapResponse(value)
			};
		})
		.reduce((acc, { key, value }) => {
			acc[key] = value;
			return acc;
		}, {});
}

function mapResponse(data, responseCollectionDescription, shouldResponseBeCommented = false) {
	if (!data) {
		return;
	} 
	if (hasRef(data)) {
		return getRef(data);
	}
	const description = data.description || responseCollectionDescription || '';
	const headers = getHeaders(get(data, `properties.headers`));
	const content = getContent(get(data, `properties.content`));
	const links = getLinks(get(data, `properties.links`));
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
	mapResponse
}