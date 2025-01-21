const yaml = require('js-yaml');

const { removeCommentLines } = require('../commentsHelper');
const validationHelper = require('./helper');
const { replaceRelativePathByAbsolute } = require('./replaceRelativePathByAbsolute');

function validate(data, logger, cb) {
	const { script, targetScriptOptions } = data;
	try {
		const filteredScript = removeCommentLines(script);
		let parsedScript = {};

		switch (targetScriptOptions.format) {
			case 'yaml':
				parsedScript = yaml.safeLoad(filteredScript);
				break;
			case 'json':
			default:
				parsedScript = JSON.parse(filteredScript);
		}

		validationHelper
			.validate(replaceRelativePathByAbsolute(parsedScript, targetScriptOptions.modelDirectory))
			.then(messages => {
				cb(null, messages);
			})
			.catch(err => {
				cb(err.message);
			});
	} catch (e) {
		logger.log('error', { error: e }, 'OpenAPI Validation Error');

		cb(e.message);
	}
}

module.exports = {
	validate,
};
