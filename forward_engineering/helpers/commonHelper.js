const get = require('lodash.get');
const getExtensions = require('./extensionsHelper');
const { hasRef } = require('./typeHelper');

function mapEnum(enums, key) {
	if (!enums) {
		return;
	}
	return enums
		.filter(item => item[key])
		.map(item => item[key]);
}

function mapExternalDocs({ externalDocsUrl, externalDocsDescription, scopesExtensions } = {}) {
	if (!externalDocsUrl) {
		return;
	}
	const externalDocs = {
		description: externalDocsDescription,
		url: externalDocsUrl
	};
	const externalDocsExtensions = getExtensions(scopesExtensions);

	return Object.assign({}, externalDocs, externalDocsExtensions);
}

function mapExternalTagDocs({ tagExternalDocsUrl, tagExternalDocsDescription } = {}) {
	if (!tagExternalDocsUrl) {
		return;
	}
	return {
		description: tagExternalDocsDescription,
		url: tagExternalDocsUrl
	};
}

function mapTags(tags = []) {
	if (tags.length === 0) {
		return;
	}
	return tags.map(tag => {
		const tagObj = {
			name: tag.tagName,
			description: tag.tagDescription,
			externalDocs: mapExternalTagDocs(tag.externalDocs)
		};
		const tagExtensions = getExtensions(tag.scopesExtensions);

		return Object.assign({}, tagObj, tagExtensions);
	});
}

function mapSecurity(security = []) {
	if (security.length === 0) {
		return;
	}
	return security
		.filter(({ securityRequirementName }) => securityRequirementName)
		.map(({ securityRequirementName, securityRequirementOperation = [] }) => {
			return {
				[securityRequirementName]: securityRequirementOperation.filter(item => item)
			};
		});
}

function mapArrayFieldByName(dataArray, fieldName) {
	return dataArray && dataArray.map(dataItem => dataItem[fieldName]);
}

function getContainersIdsForCallbacks(data) {
	const callbacks = get(JSON.parse(data.modelDefinitions), 'properties.callbacks.properties', {});
	const containersFromComponentsCallbacks = getContainersIdsFromCallbacks(callbacks);
	const containersFromRequestsCallbacks = getContainersIdsFromRequestCallbacks(data.containers);

	return containersFromRequestsCallbacks.concat(containersFromComponentsCallbacks);
}

function getContainersIdsFromRequestCallbacks(containers = []) {
	return containers.reduce((acc, container) => {
		const collections = container.entities
			.map(collectionId => JSON.parse(container.jsonSchema[collectionId]));
		
		const containerIds = collections
			.filter(({ entityType }) => entityType === 'request')
			.reduce((acc, collection) => {
				const callbacks = get(collection, 'properties.callbacks.properties', {});
				const containersIdsFromCallbacks = getContainersIdsFromCallbacks(callbacks);
				acc = [...acc, ...containersIdsFromCallbacks];
				return acc;
			}, []);
		
		acc = [...acc, ...containerIds];
		return acc;
	}, []);
}

function getContainersIdsFromCallbacks(callbacks = {}) {
	return Object.entries(callbacks)
	.reduce((acc, [key, value]) => {
		if (hasRef(value) || !value.bucketId) {
			return acc;
		}
		acc = [...acc, value.bucketId];
		return acc;
	}, []);
}

module.exports = {
	mapEnum,
	mapExternalDocs,
	mapTags,
	mapSecurity,
	mapArrayFieldByName,
	getContainersIdsForCallbacks
};
