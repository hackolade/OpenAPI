const yaml = require('js-yaml');
const path = require('path');
const validationHelper = require('./helpers/validation/helper');
const { addCommentsSigns, removeCommentLines } = require('./helpers/commentsHelper');
const { generateModelScript } = require('./helpers/generateModelScript');
const { validate } = require('./helpers/validation/validate');

module.exports = {
	generateModelScript,
	validate,
};
