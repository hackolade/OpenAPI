function removeEmptyObjectFields(inputObj) {

	const obj = JSON.parse(JSON.stringify(inputObj));

	const isObjectFieldWithNotEmptyValue = key =>
		obj[key] !== null &&
		obj[key] !== undefined &&
		(typeof obj[key] === 'string' ? obj[key].length > 0 : true) &&
		(Array.isArray(obj[key]) ? obj[key].length > 0 : true);

	return Object.keys(obj)
		.filter(isObjectFieldWithNotEmptyValue)
		.reduce(
			(newObj, key) => {
				const isObjectAndNotArray = typeof obj[key] === 'object' && !Array.isArray(obj[key]);
				if (isObjectAndNotArray) {
					return Object.assign(newObj, {
						[key]: removeEmptyObjectFields(obj[key])
				  	});
				}
					return Object.assign(newObj, { [key]: obj[key] })
			},
			{}
		);
}

module.exports = {
    removeEmptyObjectFields
};