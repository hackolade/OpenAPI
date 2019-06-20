const { mapEnum } = require('./commonHelper');
const getExtensions = require('./extensionsHelper');

function getServers(data = []) {
	if (data.length === 0) {
		return;
	}
	return data.map(server => mapServer(server));
}

function mapServer(data) {
	if (!data) {
		return;
	}
	const serverData = {
		url: data.serverURL,
		description: data.serverDescription,
		variables: mapVariables(data.serverVariables)
	};
	const extensions = getExtensions(data.scopesExtensions);

	return Object.assign({}, serverData, extensions);
}

function mapVariables(variables = []) {
	if (variables.length === 0) {
		return;
	}
	return variables
		.filter(({ serverVariableName }) => serverVariableName)
		.map(item => {
			const variable = {
				enum: mapEnum(item.serverVariableEnum, 'serverVariableEnumValue'),
				default: item.serverVariableDefault,
				description: item.serverVariableDescription,
				name: item.serverVariableName
			}
			const variableExtensions = getExtensions(item.scopesExtensions);

			return Object.assign({}, variable, variableExtensions);
		})
		.reduce((acc, item) => {
			const { name } = item;
			delete item.name;

			return Object.assign({}, acc, { [name]: item });
		}, {});
}

module.exports = {
	getServers,
	mapServer
};