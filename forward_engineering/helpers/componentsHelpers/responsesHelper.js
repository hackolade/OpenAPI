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

function mapResponse(data, responseCollectionDescription) {
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

	return Object.assign({}, { description, headers, content, links }, extensions);
}

module.exports = {
	getResponses,
	mapResponse
}