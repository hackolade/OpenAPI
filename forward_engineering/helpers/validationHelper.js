const SwaggerParser = require('swagger-parser');

const getError = (errorItem) => {
	if (errorItem.inner) {
		return {
			type: 'error',
			label: '#/' + errorItem.path.join('/'),
			title: errorItem.message,
			context: getInnerErrors(errorItem.inner)
		};
	}

	return {
		type: 'error',
		label: '#/' + errorItem.path.join('/'),
		title: errorItem.message,
		context: {
			description: errorItem.description
		}
	};
};

const at = (message) => {
	if (message.path && message.path.length) {
		return ' at #/' + message.path.join('/');
	} else {
		return '';
	}
};

const indent = (message, depth = 1) => '\t'.repeat(2 * depth) + message;

const getInnerErrors = (inner, depth = 0) => {
	return uniqStrings(inner.map((item) => {
		const formattedMessage = indent(item.message + at(item), depth);

		if (item.inner) {
			const items = getInnerErrors(item.inner, depth + 1);

			return formattedMessage + ':\n' + items;
		}

		return formattedMessage;
	}, [])).join('\n');
};

const uniqStrings = (items) => Object.keys(items.reduce((result, item) => Object.assign({}, result, { [item]: '' }), {}));

const getValidatorErrors = (error) => {
	if (!error) {
		return [];
	}

	if (Array.isArray(error.details)) {
		return error.details.map(getError);
	} else {
		return [{
			type: 'error',
			label: error.name,
			title: error.message,
			context: ''
		}];
	}
};

const validate = (script, options = {}) => new Promise((resolve, reject) => {
	SwaggerParser.validate(script, options, (err, api) => {
		const errors = getValidatorErrors(err).concat(checkPathParameters(script));
		
		if (errors.length === 0) {
			return resolve([{
				type: 'success',
				label: '',
				title: 'OpenAPI schema is valid',
				context: {
					swagger: api.swagger,
					host: api.host,
					basePath: api.basePath
				}
			}]);
		} else {
			resolve(errors);
		}
	});
});

const getPathParameters = (pathName) => {
	const regExp = /\{([\s\S]+?)\}/;

	return (pathName.match(new RegExp(regExp, 'g')) || []).map((parameter) => {
		return parameter.match(regExp)[1];
	});
};

const createPathParameterError = (pathName, parameter) => {
	return {
		type: 'error',
		label: 'Semantic Error',
		title: 'Semantic error at ' + `paths.${pathName}`,
		context: `Declared path parameter "${parameter}" needs to be defined as a path parameter at either the path or operation level`
	};
};

const checkPathParameters = (schema) => {
	return Object.keys(schema.paths).reduce((errors, pathName) => {
		const pathParameters = getPathParameters(pathName);
		const requests = schema.paths[pathName] || {};

		return pathParameters.reduce((errors, parameter) => {
			return Object.keys(requests).reduce((errors, requestName) => {
				const request = requests[requestName];

				if (!Array.isArray(request.parameters)) {
					return errors.concat(createPathParameterError(pathName, parameter));
				}

				const param = request.parameters.find((param) => param.name === parameter && param.in === 'path');

				if (param) {
					return errors;
				}

				return errors.concat(createPathParameterError(pathName, parameter));
			}, errors);
		}, errors);
	}, []);
};

module.exports = {
	validate
};
