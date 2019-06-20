const get = require('lodash.get');
const commonHelper = require('./commonHelper');
const getExtensions = require('./extensionsHelper');
const { getServers } = require('./serversHelper');
const { mapParameter } = require('./componentsHelpers/parametersHelper');
const { mapRequestBody } = require('./componentsHelpers/requestBodiesHelper');
const { mapResponse } = require('./componentsHelpers/responsesHelper');
const { hasRef, getRef } = require('./typeHelper');

function getPaths(containers, containersIdsForCallbacks = []) {
	return containers
		.filter(({ id }) => !containersIdsForCallbacks.includes(id))
		.reduce((acc, container) => {
			const { name } = container.containerData[0];
			const containerData = getRequestsForContainer(container, containers);

			acc[name] = containerData;
			return acc;
		}, {});
}

function getRequestsForContainer(container, containers, containersPath = []) {
	const { contactExtensions, summary, description } = container.containerData[0];

	const collections = container.entities.map(collectionId => JSON.parse(container.jsonSchema[collectionId]));
	const containerData = getRequestData(collections, containers, container.id, containersPath);
	const additionalContainerData = {
		summary,
		description: description || undefined 
	};

	const containerExtensions = getExtensions(contactExtensions);

	return Object.assign({}, containerData, additionalContainerData, containerExtensions);
}

function getRequestData(collections, containers, containerId, containersPath = []) {
	return collections
		.filter(collection => collection.entityType === 'request')
		.map(data => {
			const request = {
				tags: commonHelper.mapArrayFieldByName(data.tags, 'tag'),
				summary: data.summary,
				description: data.description,
				externalDocs: commonHelper.mapExternalDocs(data.externalDocs),
				operationId: data.operationId,
				parameters: mapRequestParameters(get(data, 'properties.parameters')),
				requestBody: mapRequestBody(get(data, 'properties.requestBody'), get(data, 'required', []).includes('requestBody')),
				responses: mapResponses(collections, data.GUID),
				callbacks: getCallbacks(get(data, 'properties.callbacks'), containers, containerId, containersPath),
				deprecated: data.deprecated,
				security: commonHelper.mapSecurity(data.security),
				servers: getServers(data.servers),
				methodName: data.collectionName
			};
			const extensions = getExtensions(data.operationExtensions);

			return Object.assign({}, request, extensions);
		})
		.reduce((acc, collection) => {
			const { methodName } = collection;
			delete collection.methodName;
			acc[methodName] = collection;
			return acc;
		}, {});
}

function mapRequestParameters(parameters) {
	if (!parameters || !parameters.items) {
		return;
	}
	if (Array.isArray(parameters.items)) {
		return parameters.items.map(item => mapParameter(item));
	}

	return [mapParameter(parameters.items)];
}

function mapResponses(collections, collectionId) {
	if (!collections || !collectionId) {
		return;
	}

	const responses = collections
		.filter(collection => collection.entityType === 'response' && collection.parentCollection === collectionId)
		.map(collection => {
			const responseCode = collection.collectionName;
			const response = mapResponse(get(collection, 'properties.response'), collection.description);

			return { responseCode, response };
		})
		.reduce((acc, { responseCode, response }) => {
			acc[responseCode] = response;

			return acc;
		}, {});
		
	return responses;
}

function getCallbacks(data, containers, containerId, containersPath = []) {
	if (!data || !data.properties || containersPath.includes(containerId)) {
		return;
	}

	return Object.entries(data.properties)
		.map(([key, value]) => {
			if (!value.callbackExpression) {
				return;
			}
			if (hasRef(value)) {
				return { [key]: { [value.callbackExpression]: getRef(value) }};
			}
			const containerForCallback = containers.find(({ id }) => id === value.bucketId && id !== containerId);
			if (!containerForCallback) {
				return;
			}
			const callbackData = getRequestsForContainer(
				containerForCallback,
				containers,
				[...containersPath, containerId]
			);

			return { [key]: { [value.callbackExpression]: callbackData }};

		})
		.reduce((acc, item) => {
			acc = Object.assign({}, acc, item);
			return acc;
		}, {});
}

module.exports = {
	getPaths,
	getCallbacks
};