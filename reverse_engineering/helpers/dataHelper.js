
const commonHelper = require('./commonHelper');
const propertiesConfig = require('../propertiesConfig');

const REQUEST = 'request';
const RESPONSE = 'response';
const EXTENSION_SYMBOL = 'x-';
const REQUEST_TYPE = ['get', 'put', 'post', 'delete', 'options', 'head', 'patch', '$ref'];

const getExtensions = (schema) => {
	const isExtension = (keyword) => keyword.substring(0, 2) === EXTENSION_SYMBOL;
	const getExtension = (keyword, data) => ({
		extensionPattern: keyword,
		extensionValue: typeof data === 'object' ? JSON.stringify(data) : data
	});
	
	return Object.keys(schema).reduce((accumulator, key) => {
		if (isExtension(key)) {
			const extension = getExtension(key, schema[key]);
			return [...accumulator, extension];   
		}
		return accumulator;
	}, []);
};

const getExtensionsObject = (data, keyword = 'scopesExtensions') => {
	const extensions = getExtensions(data);
	return { [keyword]: extensions };
};

const handleObject = (func, object) => {
	if (!object) {
		return {};
	}
	return Object.keys(object).reduce((accum, key) => {
		return Object.assign({}, accum, {
			[key]: func(object[key])
		})
	}, {});
}

const resolveReference = ref => ref.replace('#/components','#/definitions');

const getObjectProperties = (propsToClean, object) => {
	if (!object) {
		return {};
	}
	const filteredObject = Object.keys(object).reduce((obj, key) => {
		if (propsToClean.includes(key)) {
			return obj;
		}
		if (key === '$ref') {
			return Object.assign({}, obj, {[key]: resolveReference(object[key])});
		}
		return Object.assign({}, obj, {[key]: object[key]});
	}, {});
	return Object.assign({}, getExtensionsObject(object), filteredObject);
}

const getServersData = (servers) => {
	if (!Array.isArray(servers)) {
		return [];
	}

	return servers.reduce((accum, server) => {
		if (!server.url) {
			return accum;
		}
		
		const variables = server.variables ? getServersVariables(server.variables) : [];
		return [...accum, {
			serverURL: server.url,
			serverDescription: server.description,
			serverVariables: variables,
			scopesExtensions: getExtensions(server)
		}]
	}, []);
};

const getServersVariables = (variables) => {
	return Object.keys(variables).map(variable => {
		const variableData = variables[variable];
		return {
			serverVariableName: variable,
			serverVariableEnum: variableData.enum.map(enumVal => ({serverVariableEnumValue: enumVal})),
			serverVariableDefault: variableData.default,
			serverVariableDescription: variableData.description,
			scopesExtensions: getExtensions(variables)
		}
	}, []);
}

const handleDataByConfig = (data, config) => {
	const getContact = (contact) => ({
		contactName: contact.name,
		contactURL: contact.url,
		contactemail: contact.email,
		contactExtensions: getExtensions(contact)
	});

	const getLicense = (license) => ({
		licenseName: license.name,
		licenseURL: license.url,
		group: {},
		licenseExtensions: getExtensions(license)
	});
	
	const getInfoData = (info) => {
		const contact = info.contact ? getContact(info.contact) : undefined;
		const license = info.license ? getLicense(info.license) : undefined;
		const infoExtensions = getExtensions(info);
		
		return {
			description: info.description,
			modelVersion: info.version,
			title: info.title,
			termsOfService: info.termsOfService,
			contact,
			license,
			infoExtensions,
		};
	};

	const getSecurityData = (security = []) => {
		return security.reduce((accumulator, item) => {
			const subItems = Object.keys(item).reduce((accum, key) => {
				return [
					...accum, 
					{
						securityRequirementName: key,
						securityRequirementOperation: item[key]
					}
				]
			}, []);

			return [...accumulator, ...subItems];
		}, []);
	};

	const handleProperty = (data, config, property) => {
		switch (property) {
			case 'info':
				return getInfoData(data);
			case 'servers':
				return { servers: getServersData(data) };
			case 'security':
				return { security: getSecurityData(data) };
			default:
				return handleGeneralProperties(data, config[property], property);
		}
	};

	const handleGeneralProperties = (data, config, property) => {
		const configType = Array.isArray(config) ? 'array' : typeof config;

		if (configType === 'array') {
			data = Array.isArray(data) ? data : [data];
			return { [property]: data.map(item => handleDataByConfig(item, config[0])) };
		} else if (configType === 'object') {
			return { [property]: handleDataByConfig(data, config) };
		} else {
			return { [config]: data };
		}
	}

	if (typeof data === 'string') {
		return {
			[config]: data
		};
	}

	const extensionsObject = getExtensionsObject(data);

	return Object.assign(
		extensionsObject,
		Object.keys(config).reduce((accumulator, key) => {
			if (!data[key]) {
				return accumulator;
			}
			return Object.assign({}, accumulator, handleProperty(data[key], config, key))
		}, {})
	);   
};

const getEntityData = (schema, type = REQUEST) => {
	return handleDataByConfig(schema, propertiesConfig.entityConfig[type]);
};

const getContainersFromRequestCallbacks = request => {
	const requestCallbacks = request.callbacks || {};
	const callbacksPathsData = getContainersFromCallbacks(requestCallbacks);
	const callbacksPathData = callbacksPathsData.reduce((accum, callbacksData) => {
		return accum.concat(callbacksData)
	},[]);
	return callbacksPathData;
}

const getContainersFromCallbacks = callbacks => {
	return Object.keys(callbacks).reduce((accum, callbackName) => {
		const rawCallbackPath = callbacks[callbackName] || {};
		const containers = Object.keys(rawCallbackPath).map(pathName => {
			const callbackPath = rawCallbackPath[pathName];
			if (callbackPath.$ref) {
				return accum;
			}
			const extensionsObject = getExtensionsObject(callbackPath, 'extensions');
			const requestsNames = Object.keys(callbackPath);
			const requestCallbacksPathsData = requestsNames.reduce((accum, requestName) => {
				return accum.concat(getContainersFromRequestCallbacks(callbackPath[requestName]));
			}, []);

			return [{
				data: Object.assign({}, {name: pathName}, extensionsObject),
				callbackPath
			}, ...requestCallbacksPathsData];
		});

		return accum.concat(containers);
	}, []);
}

const getContainers = (pathData, callbacks) => {
	let updatedPathData = Object.assign({}, pathData);
	const containers = Object.keys(pathData).reduce((accum, key) => {
		const path = pathData[key];
		const extensionsObject = getExtensionsObject(path, 'extensions');
		const requestsNames = Object.keys(path);
		const requestCallbacksPathsData = requestsNames.reduce((accum, requestName) => {
			return accum.concat(getContainersFromRequestCallbacks(path[requestName]));
		}, []);
		const containersData = requestCallbacksPathsData.map(pathData => {
			updatedPathData = Object.assign({}, updatedPathData, {[pathData.data.name]: pathData.callbackPath});
			return pathData.data;
		})
		return accum.concat(Object.assign({}, { name: key }, extensionsObject), containersData);
	}, []);
	
	if (callbacks) {
		const componentCallbacksData = getContainersFromCallbacks(callbacks);
		const componentCallbacksPathData = componentCallbacksData.reduce((accum, callbacksData) => {
			return accum.concat(callbacksData)
		},[]);
		const componentCallbacksContainers = componentCallbacksPathData.map(pathData => {
			updatedPathData = Object.assign({}, updatedPathData, {[pathData.data.name]: pathData.callbackPath});
			return pathData.data;
		})
		return {containers: containers.concat(componentCallbacksContainers), updatedPathData};
	}
	
	return {containers, updatedPathData};
};

const handleExample = (data) => {
	const value = getExampleStringValue(data.value);
	return Object.assign({}, data, {type: "example", value});
}


const getSchemaObject = (data, fieldOrder)  => {
	const objectWithSchema = {properties: data};
	const schemaWithChoices = handleSchemaChoices(objectWithSchema, fieldOrder);
	const schemaChoice = commonHelper.CHOICES.find(choiceType => schemaWithChoices[choiceType]);
	const schema = handleSchemaProps(data.schema, fieldOrder);
	if (schemaChoice) {
		return {[schemaChoice]: schemaWithChoices[schemaChoice]};
	}
	return {properties: {schema: Object.assign({}, schema, {subtype: 'schema'})}};
};

const getExamplesObject = data => {
	const examples = handleObject(handleExample, data.examples);
	return {
		type: "object",
		subtype: 'example',
		structureType: true,
		properties: examples
	};
}

const getContentObject = data => {
	const content = handleObject(handleMedia, data.content);

	return {
		type: "object",
		subtype: 'media',
		structureType: true,
		properties: content
	};
};

const getHeadersObject = data => {
	const headers = handleObject(handleHeader, data.headers);

	return {
		type: "object",
		subtype: 'header',
		structureType: true,
		properties: headers
	};
};

const handleExpression = (data) => {
	return {
		type: 'expression',
		expression: data
	}
};

const getExampleStringValue = exampleData => (typeof exampleData === 'string') ? exampleData : JSON.stringify(exampleData);

const handleLink = (data) => {
	const requestBody = handleExpression(data.requestBody);
	const parameters = handleObject(handleExpression, data.parameters);
	const server = data.server && getServersData([data.server]);

	return Object.assign({}, data, {
		type: 'link',
		subtype: 'expression',
		properties: {
			parameters: {
				type: 'operationObject',
				subtype: 'expression',
				properties: parameters
			},
			requestBody
		}
	}, server, getExtensionsObject(data));
};

const getLinksObject = data => {
	const links = handleObject(handleLink, data.links);

	return {
		type: "object",
		subtype: 'link',
		structureType: true,
		properties: links
	};
};

const handleHeader = (data, fieldOrder) => {
	const schemaObject = getSchemaObject(data, fieldOrder);
	const content = getContentObject(data);
	const examples = getExamplesObject(data);
	const headerProperties = Object.assign({}, schemaObject.properties || {}, {
		content,
		examples
	});
	const header = Object.assign({}, schemaObject, data, {
		sample: getExampleStringValue(data.example),
		type: 'header',
		properties: headerProperties
	});
	const propsToClean = ['schema', 'examples', 'example', 'content'];
	return getObjectProperties(propsToClean, header);
}

const handleEncoding = (data) => {
	const propsToClean = ["headers"];
	return Object.assign({}, getObjectProperties(propsToClean, data), {
		type: "encoding",
		properties: {
			headers: {
				type: "object",
				subtype: "header",
				structureType: true,
				properties: handleObject(handleHeader, data.headers)
			}
		}
	});
}

const handleMedia = (data, fieldOrder) => {
	const schemaObject = getSchemaObject(data, fieldOrder);
	const examples = {
		type: "object",
		subtype: "example",
		properties: handleObject(handleExample, data.examples),
		structureType: true
	};
	const encoding = {
		type: "object",
		subtype: "encoding",
		properties: handleObject(handleEncoding, data.encoding),
		structureType: true
	};
	const mediaProperties = Object.assign({}, schemaObject.properties || {}, {
		examples,
		encoding
	});
	const propsToClean = ["schema", "examples", "encoding", "example"];
	return Object.assign({}, schemaObject, getObjectProperties(propsToClean, data), {
		sample: getExampleStringValue(data.example),
		type: 'media',
		properties: mediaProperties
	});
}

const handleRequestBody = (data, fieldOrder) => {
	const media = handleObject(handleMedia, data.content);
	const propsToClean = ["content"];
	return Object.assign({}, getObjectProperties(propsToClean, data), {
		type: "requestBody",
		properties: media
	})
}

const handleCallback = (data, fieldOrder) => {
	const callbackExpression = (Object.keys(data) || [])[0];
	return Object.assign({}, {type: "callback", bucketId: callbackExpression, callbackExpression}, getExtensionsObject(data));
}

const handleChoiceProperty = (fieldOrder, rawChoice, name) => {
	const choiceProperty = Object.keys(rawChoice).map(key => ({
		[name]: handleSchemaProps(rawChoice[key], fieldOrder)
	}));
	return choiceProperty;
}

const handleSchemaChoices = (schema, fieldOrder) => {
	if (!schema || !schema.properties) {
		return schema;
	}
	const schemaProps = schema.properties;
	const schemaChoices = Object.keys(schemaProps).reduce((accum, property) => {
		const choiceType = commonHelper.CHOICES.find(choice => schemaProps[property] && schemaProps[property][choice]);
		if (!choiceType) {
			return accum;
		}
		const currentChoicesWithSameType = accum[choiceType];
		const choiceData = { 
			name : property,
		 	rawChoice: schemaProps[property][choiceType]
		};

		if (!currentChoicesWithSameType) {
			return Object.assign({}, accum, {[choiceType]: [choiceData]});
		}

		return Object.assign({}, accum, {[choiceType]: accum[choiceType].concat(choiceData)});		
	}, {});

	const choiceTypes = Object.keys(schemaChoices);
	if (!choiceTypes.length) {
		return schema;
	}
	
	const hasMultipleOneOf = schemaChoices.oneOf && schemaChoices.oneOf.length > 1;
	const hasAllOf = schemaChoices.allOf;
	let multipleOneOf;
	if (hasMultipleOneOf) {
		const choiceOneOfSubschemas = schemaChoices['oneOf'].reduce((accum, choiceData) => {
			delete schemaProps[choiceData.name];
			return accum.concat({
				type: 'object',
				oneOf: handleChoiceProperty(fieldOrder, choiceData.rawChoice, choiceData.name).map(item => ({
					type: 'object',
					properties: item
				}))
			});
		}, []);
		multipleOneOf = choiceOneOfSubschemas;
	}

	const resolvedChoices = choiceTypes.reduce((accum, choiceType) => {
		if (choiceType === 'oneOf' && hasMultipleOneOf) {
			return accum;
		}
		const choiceProperties = schemaChoices[choiceType].reduce((accum, choiceData) => {
			delete schemaProps[choiceData.name];
			return accum.concat(handleChoiceProperty(fieldOrder, choiceData.rawChoice, choiceData.name))
		}, []);
		
		const subschemas = choiceProperties.map(choiceProp => ({
			type: "object",
			properties: choiceProp
		}))
		
		if (choiceType === 'allOf' && hasMultipleOneOf) {
			return Object.assign({}, accum, {
				[choiceType] : subschemas.concat(multipleOneOf)
			})
		}
		
		return Object.assign({}, accum, {
			[choiceType] : subschemas
		});
	}, {});

	if (!hasAllOf && hasMultipleOneOf) {
		const choicesWithAllOf = Object.assign({}, resolvedChoices, {allOf: multipleOneOf});
		return Object.assign({}, schema, choicesWithAllOf, {properties: schemaProps});
	}

	return Object.assign({}, schema, resolvedChoices, {properties: schemaProps});
}

const handleSchemaExample = (schemaType, example) => {
	if (schemaType === 'object' || schemaType === 'array') {
		return getExampleStringValue(example);
	}
	return example;
}
const handleSchemaXml = (data) => ({
	xmlName: data.name,
	xmlNamespace: data.namespace,
	xmlPrefix: data.prefix,
	xmlAttribute: data.attribute,
	xmlWrapped: data.wrapped,
	xmlExtensions: getExtensions(data)
});

const handleAdditionalProperties = (schema) => {
	const data = schema.additionalProperties;
	if (!data) {
		return schema;
	}
	if (typeof data === "object") {
		if (data.format) {
			return Object.assign({}, schema, {
				additionalPropControl: 'Object',
				additionalPropertiesObjectType: data.type,
				additionalPropertiesIntegerFormat: data.format
			});
		}
		return Object.assign({}, schema, {
			additionalPropControl: 'Object',
			additionalPropertiesObjectType: data.type
		});
	} else {
		return Object.assign({}, schema, {
			additionalPropControl: 'Boolean',
			additionalProperties: !!data
		})
	}
}

const handleSchemaProperty = (property, data) => {
	switch(property) {
		case 'xml':
			return handleSchemaXml(data);
		case '$ref':
			return resolveReference(data);
		default:
			if (commonHelper.CHOICES.find(choice => data[choice])) {
				return handleSchemaProps(data);
			}
			return data;
	}
};

const setMissedType = (schema) => {
	if (!schema.type && (schema.properties || schema.patternProperties ||
		commonHelper.CHOICES.find(choiceType => schema[choiceType])
	)) {
		schema.type = 'object';
	} else if (schema.items && !schema.type) {
		schema.type = 'array';
	}
	return schema;
}

const handleSchemaProps = (schema, fieldOrder) => {
	if (!schema) {
		schema = {
			type: 'object'
		};
	}

	const fixedSchema = setMissedType(schema);
	const schemaWithAdditionalPropertiesData = handleAdditionalProperties(fixedSchema);
	const schemaWithChoices = handleSchemaChoices(schemaWithAdditionalPropertiesData, fieldOrder);
	const reorderedSchema = commonHelper.reorderFields(schemaWithChoices, fieldOrder);
	const schemaWithHandledProperties = Object.keys(reorderedSchema).reduce((accumulator, property) => {
		if (property === 'example') {
			property = 'sample';
		}
		accumulator[property] = (() => {
			if (['properties', 'patternProperties'].includes(property)) {
				return Object.keys(reorderedSchema[property]).reduce((accum, key) => {
					accum[key] = handleSchemaProps(reorderedSchema[property][key], fieldOrder);
					return accum;
				}, {});
			} else if (commonHelper.CHOICES.includes(property)) {
				return (reorderedSchema[property] || []).map(item => handleSchemaProps(item));
			} else if (property === 'sample') {
				return handleSchemaExample(reorderedSchema.type, reorderedSchema['example']);
			} else if (property === 'items') {
				return handleSchemaProps(reorderedSchema[property], fieldOrder);
			} else {
				return handleSchemaProperty(property, reorderedSchema[property]);
			}
		})();
		return accumulator;
	}, {});

	return schemaWithHandledProperties;
};

const handleDefinitionSchemaProps = (schema, fieldOrder) => {
	if (!schema) {
		schema = {
			type: 'object'
		};
	}

	const fixedSchema = setMissedType(schema);
	const schemaWithAdditionalPropertiesData = handleAdditionalProperties(fixedSchema);
	const reorderedSchema = commonHelper.reorderFields(schemaWithAdditionalPropertiesData, fieldOrder);
	const schemaWithHandledProperties = Object.keys(reorderedSchema).reduce((accumulator, property) => {
		if (property === 'example') {
			property = 'sample';
		}
		accumulator[property] = (() => {
			if (['properties', 'patternProperties'].includes(property)) {
				return Object.keys(reorderedSchema[property]).reduce((accum, key) => {
					accum[key] = handleSchemaProps(reorderedSchema[property][key], fieldOrder);
					return accum;
				}, {});
			} else if (commonHelper.CHOICES.includes(property)) {
				return (reorderedSchema[property] || []).map(item => handleSchemaProps(item));
			} else if (property === 'sample') {
				return handleSchemaExample(reorderedSchema.type, reorderedSchema['example']);
			} else if (property === 'items') {
				return handleDefinitionSchemaProps(reorderedSchema[property], fieldOrder);
			} else {
				return handleSchemaProperty(property, reorderedSchema[property]);
			}
		})();
		return accumulator;
	}, {});

	return schemaWithHandledProperties;
};

const handleParameter = (parameter, fieldOrder) => {
	const getParameterType = parameter => {
		const type = `parameter (${parameter.in})`;
		return type;
	}

	const parameterSchemaObject = getSchemaObject(parameter, fieldOrder);
	const parameterContent = getContentObject(parameter, fieldOrder);
	const parameterExamples = getExamplesObject(parameter, fieldOrder);
	const parameterType = getParameterType(parameter);
	const parameterProperties = Object.assign({}, parameterSchemaObject.properties || {}, {
		content: parameterContent,
		examples: parameterExamples
	});
	const newParameter = Object.assign({}, parameterSchemaObject, parameter, {
		parameterName: parameter.name,
		sample: getExampleStringValue(parameter.example),
		type: parameterType,
		properties: parameterProperties
	});
	const propsToClean = ['schema', 'examples', 'example', 'in', 'content'];
	return getObjectProperties(propsToClean, newParameter);
};

const getParametersData = (parameters, fieldOrder) => {
	const parametersData = (parameters || []).reduce((accumulator, parameter) => {
		return [...accumulator, handleParameter(parameter, fieldOrder)];
	}, []);

	return parametersData;
};

const handleSecuritySchemes = (data) => {
	const propsToClean = ['name', 'type'];
	if (data.flows) {
		data.flows = Object.keys(data.flows).reduce((accum, flow) => {
			const flowObject = data.flows[flow];
			if (flowObject) {
				flowObject.scopes = Object.keys(flowObject.scopes).reduce((scopeAccum, scopeKey) => {
					return scopeAccum.concat({scopeName: scopeKey, scopeDescription: flowObject.scopes[scopeKey]});
				}, [])
			}
			return Object.assign({}, accum, {[flow]: flowObject});
		}, {});
	}
	return Object.assign({}, getObjectProperties(propsToClean, data),{
		type: "securityScheme",
		apiKeyName: data.name,
		schemeType: data.type
	});
};

const handleRequestData = (requestData, request, fieldOrder) => {
	const responses = requestData.responses;
	const entityData = getEntityData(requestData, REQUEST);
	const parametersData = getParametersData(requestData.parameters, fieldOrder);
	const requestBody = handleRequestBody(requestData.requestBody || {}, fieldOrder);
	const callbacksData = handleObject(handleCallback, requestData.callbacks);
	const requestSchema = {
		parameters: {
			structureType: true,
			type: "array",
			subtype: "anyParameter",
			items: parametersData
		},
		requestBody,
		callbacks: {
			type: "operationObject",
			subtype: "callback",
			properties: callbacksData
		}
	};
	const jsonSchema = Object.assign({}, entityData, {
		type: 'object',
		entityType: REQUEST,
		subtype: 'requestBody',
		collectionName: request,
		properties: requestSchema,
		isActivated: true
	});
	return { jsonSchema, responses };
};

const handleResponse = (responseObj, fieldOrder) => {
	const headers = getHeadersObject(responseObj);
	const content = getContentObject(responseObj);
	const links = getLinksObject(responseObj);
	const propsToClean = ["headers", "content", "links"];
	const propertiesSchema = {
		headers,
		content,
		links
	};
	return Object.assign({}, getObjectProperties(propsToClean, responseObj), {
		type: "response",
		properties: propertiesSchema
	});
};

const handleResponseData = (responseObj, response, request, fieldOrder) => {
	const responseData = handleResponse(responseObj, fieldOrder);
	const jsonSchema = {
		type: 'object',
		subtype: 'response',
		description: responseData.description,
		entityType: RESPONSE,
		collectionName: response,
		parentCollection: request,
		properties: {
			response: responseData
		},
		isActivated: true
	};
	return jsonSchema;
};

const getEntities = (pathData, containers, fieldOrder) => {
	return containers.reduce((accumulator, container) => {
		const containerData = pathData[container.name];
		const entitiesNames = Object.keys(containerData).filter(item => REQUEST_TYPE.includes(item));
		const entities = entitiesNames.reduce((accumulator, request) => {
			const requestData = containerData[request];
			const { jsonSchema, responses } = handleRequestData(requestData, request, container.name, fieldOrder);
			const responseSchemas = Object.keys(responses || {}).map(response => {
				return handleResponseData(responses[response], response, request, fieldOrder)
			});
			return [...accumulator, jsonSchema, ...responseSchemas];
		}, []);
		return Object.assign(accumulator, { [container.name]: entities });
	}, {});
};


const getModelData = (schema) => {
	return handleDataByConfig(schema, propertiesConfig.modelConfig);
};

const getComponents = (schemaComponents = {}, fieldOrder) => {
	const schemasData = handleObject(schemas => handleDefinitionSchemaProps(schemas || {}, fieldOrder), schemaComponents.schemas);
	const parametersData = handleObject(handleParameter, schemaComponents.parameters);
	const examplesData = handleObject(handleExample, schemaComponents.examples);
	const requestBodiesData = handleObject(handleRequestBody, schemaComponents.requestBodies);
	const headersData = handleObject(handleHeader, schemaComponents.headers);
	const responsesData = handleObject(handleResponse, schemaComponents.responses);
	const securitySchemesData = handleObject(handleSecuritySchemes, schemaComponents.securitySchemes);
	const callbacksData = handleObject(handleCallback, schemaComponents.callbacks);
	const linksData = handleObject(handleLink, schemaComponents.links);
	const extensionsData = getExtensionsObject(schemaComponents);
	const COMPONENT_OBJECT_TYPE = "componentObject";

	const schemas =  {
		type: COMPONENT_OBJECT_TYPE,
		subtype: "schema",
		structureType: true,
		properties: schemasData
	}
	const responses =  {
		type: COMPONENT_OBJECT_TYPE,
		subtype: "response",
		structureType: true,
		properties: responsesData
	}
	const parameters =  {
		type: COMPONENT_OBJECT_TYPE,
		subtype: "anyParameter",
		structureType: true,
		properties: parametersData
	}
	const examples =  {
		type: COMPONENT_OBJECT_TYPE,
		subtype: "example", 
		structureType: true,
		properties: examplesData
	}
	const requestBodies =  {
		type: COMPONENT_OBJECT_TYPE,
		subtype: "request", 
		structureType: true,
		properties: requestBodiesData
	}
	const headers =  {
		type: COMPONENT_OBJECT_TYPE,
		subtype: "header", 
		structureType: true,
		properties: headersData
	}
	const securitySchemes =  {
		type: COMPONENT_OBJECT_TYPE,
		subtype: "securityScheme", 
		structureType: true,
		properties: securitySchemesData
	}
	const links =  {
		type: COMPONENT_OBJECT_TYPE,
		subtype: "link", 
		structureType: true,
		properties: linksData
	}
	const callbacks =  {
		type: COMPONENT_OBJECT_TYPE,
		subtype: "callback", 
		structureType: true,
		properties: callbacksData
	}
	const extensions =  Object.assign({}, {
		type: 'extensions',
		structureType: true
	}, extensionsData);

	const definitionsSchema = { 
		definitions: 
			{
				schemas,
				responses,
				parameters,
				examples,
				requestBodies,
				headers,
				securitySchemes,
				links,
				callbacks,
				["Specification Extensions"]: extensions
			}
	};
	return JSON.stringify(definitionsSchema);
};

const getModelContent = (pathData, fieldOrder, callbacksComponent) => {
	const { updatedPathData, containers } = getContainers(pathData, callbacksComponent);
	const entities = getEntities(updatedPathData, containers, fieldOrder);
	return { containers, entities };
};

const getOpenAPIJsonSchema = (data, fileName, extension) => {
	const schema = extension !== '.json' ? commonHelper.convertYamlToJson(data) : data;
	const openAPISchema = typeof schema === 'string' ? JSON.parse(schema) : schema;
	const updatedOpenApiSchema = copyPathItemLevelParametersToOperationObject(openAPISchema);
	const openAPISchemaWithModelName = Object.assign({}, updatedOpenApiSchema, {
		modelName: fileName
	});
	return openAPISchemaWithModelName;
};

const copyPathItemLevelParametersToOperationObject = (schema) => {
	const operations = ['get', 'put', 'post', 'delete', 'options', 'head', 'patch', 'trace'];
	if (schema.paths) {
		for (const path in schema.paths) {
			if (Array.isArray(schema.paths[path].parameters)) {
				for (const pathItem in schema.paths[path]) {
					if (operations.includes(pathItem)) {
						schema.paths[path][pathItem].parameters =
							[...schema.paths[path][pathItem].parameters || [], ...schema.paths[path].parameters];
					}
				}
			}
		}
	}
	return schema;
}

const validateOpenAPISchema = (schema) => {
	const openapi = schema.openapi;
	const isCorrectVersion = openapi && openapi.slice(0, 4) === '3.0.';
	return isCorrectVersion;
};

module.exports = {
	getModelData,
	getComponents,
	getModelContent,
	getOpenAPIJsonSchema,
	validateOpenAPISchema
};
