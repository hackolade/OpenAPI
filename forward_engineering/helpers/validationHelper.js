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

const validate = (script, options = {}) => new Promise((resolve, reject) => {
	SwaggerParser.validate(script, options, (err, api) => {
		if (!err) {
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
		} else if (Array.isArray(err.details)) {
			resolve(err.details.map(getError));
		} else {
			resolve([{
				type: 'error',
				label: err.name,
				title: err.message,
				context: ''
			}]);
		}
	});
});

module.exports = {
	validate
};
