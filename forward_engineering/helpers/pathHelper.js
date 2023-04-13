const get = require('lodash.get');
const commonHelper = require('./commonHelper');
const getExtensions = require('./extensionsHelper');
const { getServers } = require('./serversHelper');
const { mapParameter } = require('./componentsHelpers/parametersHelper');
const { mapRequestBody } = require('./componentsHelpers/requestBodiesHelper');
const { mapResponse } = require('./componentsHelpers/responsesHelper');
const { hasRef, getRef } = require('./typeHelper');
const { getArrayItems } = require('./sharedHelper');

function getPaths(containers, containersIdsForCallbacks = [], specVersion) {
	return containers
		.filter(({ id }) => !containersIdsForCallbacks.includes(id))
		.reduce((acc, container, index) => {
			const { name, isActivated } = container.containerData[0];
			const containerData = getRequestsForContainer({ container, containers, containersPath: [], isPathActivated: isActivated, specVersion });

			if (!isActivated) {
				acc[`hackoladeCommentStart${index}`] = true; 
			}

			acc[name] = containerData;

			if (!isActivated) {
				acc[`hackoladeCommentEnd${index}`] = true; 
			}
			return acc;
		}, {});
}

function getRequestsForContainer({ container, containers, containersPath = [], isPathActivated = true, specVersion }) {
	const { contactExtensions, summary, description } = container.containerData[0];

	const collections = container.entities.map(collectionId => JSON.parse(container.jsonSchema[collectionId]));
	const containerData = getRequestData({ collections, containers, containerId: container.id, containersPath, isPathActivated, specVersion });
	const additionalContainerData = {
		summary,
		description: description || undefined 
	};

	const containerExtensions = getExtensions(contactExtensions);

	return Object.assign({}, containerData, additionalContainerData, containerExtensions);
}

function getRequestData({ collections, containers, containerId, containersPath = [], isPathActivated = true, specVersion }) {
	return collections
		.filter(collection => collection.entityType === 'request')
		.map(data => {
			const isRequestActivated = data.isActivated && isPathActivated;
			const requestBodyPropKeyword = getRequestBodyPropKeyword(data.properties);
			let request = {
				tags: commonHelper.mapArrayFieldByName(data.tags, 'tag'),
				summary: data.summary,
				description: data.description,
				externalDocs: commonHelper.mapExternalDocs(data.externalDocs),
				operationId: data.operationId,
				parameters: mapRequestParameters({
					parameters: get(data, 'properties.parameters'),
					isParentActivated: isRequestActivated,
					specVersion
				})
			};
			const extensions = getExtensions(data.scopesExtensions);

			if (!['get', 'delete'].includes(String(data.collectionName).toLowerCase())) {
				request.requestBody = mapRequestBody({
					data: get(data.properties, requestBodyPropKeyword),
					required: get(data, 'required', []).includes(requestBodyPropKeyword),
					isParentActivated: isRequestActivated,
					specVersion
				});
			}

			request = {
				...request,
				responses: mapResponses({
					collections,
					collectionId: data.GUID,
					isRequestActivated,
					specVersion
				}),
				callbacks: getCallbacks({
					data: get(data, 'properties.callbacks'),
					containers,
					containerId,
					containersPath,
					specVersion
				}),
				deprecated: data.deprecated,
				security: commonHelper.mapSecurity(data.security),
				servers: getServers(data.servers),
				methodName: data.collectionName,
				isActivated: data.isActivated,
			};

			return Object.assign({}, request, extensions);
		})
		.reduce((acc, collection, index) => {
			const { methodName, isActivated } = collection;
			delete collection.methodName;
			delete collection.isActivated;
			const shouldCommentedFlagBeInserted = !isActivated && isPathActivated;
			if (shouldCommentedFlagBeInserted) {
				acc[`hackoladeCommentStart${index}`] = true; 
			}
			acc[methodName] = collection;
			if (shouldCommentedFlagBeInserted) {
				acc[`hackoladeCommentEnd${index}`] = true; 
			}
			return acc;
		}, {});
}

function mapRequestParameters({ parameters, isParentActivated = false, specVersion }) {
	let parametersData = getArrayItems({ items: parameters?.items, prefixItems: parameters?.prefixItems, specVersion });
	if (!parametersData) {
		return;
	}
	if (!Array.isArray(parametersData)) {
		parametersData = [parametersData];
	}
	
	return parametersData.map(item => mapParameter({ data: item, required: false, isParentActivated, specVersion }));
}

function mapResponses({ collections, collectionId, isParentActivated, specVersion }) {
	if (!collections || !collectionId) {
		return;
	}

	const responses = collections
		.filter(collection => collection.entityType === 'response' && collection.parentCollection === collectionId)
		.map(collection => {
			const responseCode = collection.collectionName;
			const shouldResponseBeCommented = !collection.isActivated && isParentActivated;
			const extensions = getExtensions(collection.scopesExtensions);
			const response = mapResponse({ data: get(collection, ['properties', Object.keys(collection.properties)[0]]), responseCollectionDescription: collection.description, shouldResponseBeCommented, specVersion });

			return { responseCode, response: { ...response, ...extensions } };
		})
		.reduce((acc, { responseCode, response }) => {
			acc[responseCode] = response;
			return acc;
		}, {});
		
	return responses;
}

function getCallbacks({ data, containers, containerId, containersPath = [], specVersion }) {
	if (!data || !data.properties || containersPath.includes(containerId)) {
		return;
	}

	return Object.entries(data.properties)
		.map(([key, value]) => {
			if (!value.callbackExpression) {
				return;
			}
			if (hasRef(value)) {
				return { [key]: { [value.callbackExpression]: getRef(value, specVersion) }};
			}
			const containerForCallback = containers.find(({ id }) => id === value.bucketId && id !== containerId);
			if (!containerForCallback) {
				return;
			}
			const callbackData = getRequestsForContainer({
				container: containerForCallback,
				containers,
				containersPath: [...containersPath, containerId],
				specVersion
			});
			const extensions = getExtensions(value.scopesExtensions);

			return { [key]: { [value.callbackExpression]: callbackData, ...extensions }};

		})
		.reduce((acc, item) => {
			acc = Object.assign({}, acc, item);
			return acc;
		}, {});
}

function getRequestBodyPropKeyword(properties = {}) {
	const defaultKeyword = 'requestBody'; 
	const restRequestPropNames = ['parameters', 'callbacks'];

	if (get(properties, defaultKeyword)) {
		return defaultKeyword;
	}

	const requestBodyKey = Object.keys(properties).find(key => !restRequestPropNames.includes(key));
	return requestBodyKey
}

module.exports = {
	getPaths,
	getCallbacks
};