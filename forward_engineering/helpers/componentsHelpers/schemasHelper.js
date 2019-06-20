const get = require('lodash.get');
const typeHelper = require('../typeHelper');

function getSchemas(data) {
	if (!data || !data.properties) {
		return;
	}

	return Object.keys(data.properties).reduce((acc, key) => {
		acc[key] = mapSchema(prepareSchemaChoices(data.properties[key], key));
		return acc;
	}, {});
}

function mapSchema(data) {
	return typeHelper.getType(data);
}

function prepareSchemaChoices(definition, key) {
	const mapChoice = (item) => {
		const choiceValue = get(item, `properties.${key}`); 
		if (choiceValue) {
			return choiceValue;
		}
		return item;
	}

	if (!definition) {
		return;
	}
	const multipleChoices = ['allOf', 'anyOf', 'oneOf', 'not'];
	return multipleChoices.reduce((acc, choice) => {
		if (acc[choice]) {
			if (choice === 'not') {
				acc[choice] = mapChoice(acc[choice]);
			} else {
				acc[choice] = acc[choice].map(mapChoice); 
			}
		}
		return acc;
	}, Object.assign({}, definition));
}

module.exports = {
	getSchemas,
	mapSchema
}