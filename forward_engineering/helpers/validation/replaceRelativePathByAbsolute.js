const path = require('path');

const replaceRelativePathByAbsolute = (script, modelDirectory) => {
	if (!modelDirectory || typeof modelDirectory !== 'string') {
		return script;
	}
	const stringifiedScript = JSON.stringify(script);
	const fixedScript = stringifiedScript.replace(/("\$ref":\s*)"(.*?(?<!\\))"/g, (match, refGroup, relativePath) => {
		const isAbsolutePath = relativePath.startsWith('file:');
		const isInternetLink = relativePath.startsWith('http:') || relativePath.startsWith('https:');
		const isModelRef = relativePath.startsWith('#');
		if (isAbsolutePath || isInternetLink || isModelRef) {
			return match;
		}
		const absolutePath = path.join(path.dirname(modelDirectory), relativePath).replace(/\\/g, '/');
		return `${refGroup}"file://${absolutePath}"`;
	});
	return JSON.parse(fixedScript);
};

module.exports = {
	replaceRelativePathByAbsolute,
};
