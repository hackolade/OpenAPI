const globals = require('globals');

module.exports = {
	ignores: [
		'.git/**',
		'.vscode/**',
		'.idea/**',
		'node_modules/**',
		'reverse_engineering/node_modules/**',
		'forward_engineering/node_modules/**',
		'build/**',
		'release/**',
	],
	rules: {
		'no-cond-assign': 'error',
		'no-const-assign': 'error',
		'no-dupe-args': 'error',
		'no-dupe-keys': 'error',
		'no-duplicate-case': 'error',
		'no-unreachable': 'error',
		'eqeqeq': 'error',
		'no-var': 'error',
		'no-undef': 'error',
		'no-bitwise': 'warn',
		'no-dupe-else-if': 'warn',
		'no-duplicate-imports': 'warn',
		'no-import-assign': 'warn',
		'no-empty': 'warn',
		'no-extra-semi': 'error',
		'no-global-assign': 'warn',
		'no-redeclare': 'warn',
		'no-debugger': 'error',
		'no-console': 'error',
	},
	languageOptions: {
		sourceType: 'commonjs',
		globals: {
			...globals.node,
		},
		ecmaVersion: 'latest',
	},
};
