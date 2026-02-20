const path = require('path');

const DEFAULT_RELEASE_FOLDER_PATH = path.resolve(__dirname, 'release');

const EXCLUDED_EXTENSIONS = ['.js', '.g4', '.interp', '.tokens'];
const EXCLUDED_FILES = [
	'.github',
	'.DS_Store',
	'.editorconfig',
	'.git',
	'.gitignore',
	'.vscode',
	'.idea',
	'.prettierignore',
	'.dockerignore',
	'.oxlintrc.json',
	'build',
	'release',
	'node_modules',
	'package-lock.json',
	'prettier.config.js',
	'lint-staged.config.js',
];

module.exports = {
	DEFAULT_RELEASE_FOLDER_PATH,
	EXCLUDED_EXTENSIONS,
	EXCLUDED_FILES,
};
